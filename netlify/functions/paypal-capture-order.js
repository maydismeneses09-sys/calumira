const { createClient } = require("@supabase/supabase-js");

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey:
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY,

  paypalClientId: process.env.PAYPAL_CLIENT_ID,
  paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET,
  paypalEnv: process.env.PAYPAL_ENV || "sandbox",
};

const PAYPAL_BASE_URL =
  CONFIG.paypalEnv === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

const supabase = createSupabaseClient();

exports.handler = async function handler(event) {
  try {
    if (event.httpMethod === "OPTIONS") {
      return response(200, { ok: true });
    }

    if (event.httpMethod !== "POST") {
      return response(405, {
        ok: false,
        error: "METHOD_NOT_ALLOWED",
        message: "Solo se permite POST.",
      });
    }

    assertEnvironment();

    const input = parseBody(event.body);
    const paypalOrderId = String(
      input.paypal_order_id || input.orderID || input.order_id || ""
    ).trim();

    if (!paypalOrderId) {
      return response(400, {
        ok: false,
        error: "MISSING_PAYPAL_ORDER_ID",
        message: "Falta paypal_order_id.",
      });
    }

    const pagoExistente = await getPaymentByOrderId(paypalOrderId);

    if (!pagoExistente) {
      return response(404, {
        ok: false,
        error: "PAYMENT_NOT_FOUND",
        message: "No se encontró un pago pendiente para esta orden.",
      });
    }

    if (pagoExistente.estado === "aprobado") {
      return response(200, {
        ok: true,
        etapa: "paypal_order_already_captured",
        pago: {
          id: pagoExistente.id,
          estado: pagoExistente.estado,
          paypal_order_id: pagoExistente.paypal_order_id,
          paypal_capture_id: pagoExistente.paypal_capture_id,
          producto_id: pagoExistente.producto_id,
          producto_nombre: pagoExistente.producto_nombre,
        },
      });
    }

    const accessToken = await getPayPalAccessToken();

    const capture = await capturePayPalOrder({
      accessToken,
      paypalOrderId,
    });

    const captureId = extractCaptureId(capture);
    const paypalStatus = capture.status || "UNKNOWN";

    if (paypalStatus !== "COMPLETED") {
      const pagoActualizado = await updatePayment({
        paypalOrderId,
        estado: "fallido",
        paypalCaptureId: captureId,
        rawCapture: capture,
      });

      return response(400, {
        ok: false,
        error: "PAYPAL_CAPTURE_NOT_COMPLETED",
        message: "El pago no fue completado por PayPal.",
        paypal_status: paypalStatus,
        pago: {
          id: pagoActualizado.id,
          estado: pagoActualizado.estado,
        },
      });
    }

    const pagoAprobado = await updatePayment({
      paypalOrderId,
      estado: "aprobado",
      paypalCaptureId: captureId,
      rawCapture: capture,
    });

    return response(200, {
      ok: true,
      etapa: "paypal_order_captured",
      paypal_env: CONFIG.paypalEnv,
      paypal: {
        order_id: paypalOrderId,
        status: paypalStatus,
        capture_id: captureId,
      },
      pago: {
        id: pagoAprobado.id,
        estado: pagoAprobado.estado,
        producto_id: pagoAprobado.producto_id,
        producto_nombre: pagoAprobado.producto_nombre,
        monto: pagoAprobado.monto,
        moneda: pagoAprobado.moneda,
        paypal_order_id: pagoAprobado.paypal_order_id,
        paypal_capture_id: pagoAprobado.paypal_capture_id,
      },
    });
  } catch (error) {
    console.error("[paypal-capture-order-error]", error);

    return response(error.statusCode || 500, {
      ok: false,
      error: error.code || "INTERNAL_ERROR",
      message: error.publicMessage || "No se pudo capturar la orden de PayPal.",
    });
  }
};

function createSupabaseClient() {
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) {
    return null;
  }

  return createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey, {
    auth: {
      persistSession: false,
    },
  });
}

function assertEnvironment() {
  if (!CONFIG.supabaseUrl) {
    throw appError(500, "MISSING_SUPABASE_URL", "Falta SUPABASE_URL.");
  }

  if (!CONFIG.supabaseKey) {
    throw appError(500, "MISSING_SUPABASE_KEY", "Falta SUPABASE_SERVICE_KEY.");
  }

  if (!CONFIG.paypalClientId) {
    throw appError(500, "MISSING_PAYPAL_CLIENT_ID", "Falta PAYPAL_CLIENT_ID.");
  }

  if (!CONFIG.paypalClientSecret) {
    throw appError(
      500,
      "MISSING_PAYPAL_CLIENT_SECRET",
      "Falta PAYPAL_CLIENT_SECRET."
    );
  }

  if (!supabase) {
    throw appError(
      500,
      "SUPABASE_CLIENT_NOT_READY",
      "Cliente Supabase no inicializado."
    );
  }
}

function parseBody(rawBody) {
  if (!rawBody) {
    throw appError(400, "EMPTY_BODY", "El cuerpo de la solicitud está vacío.");
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw appError(400, "INVALID_JSON", "El cuerpo no es un JSON válido.");
  }
}

async function getPaymentByOrderId(paypalOrderId) {
  const { data, error } = await supabase
    .from("pagos")
    .select("*")
    .eq("paypal_order_id", paypalOrderId)
    .single();

  if (error) {
    console.error("[supabase-payment-query-error]", error);
    return null;
  }

  return data;
}

async function getPayPalAccessToken() {
  const credentials = Buffer.from(
    `${CONFIG.paypalClientId}:${CONFIG.paypalClientSecret}`
  ).toString("base64");

  const paypalResponse = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!paypalResponse.ok) {
    const errorText = await paypalResponse.text();
    console.error("[paypal-token-error]", errorText);

    throw appError(
      502,
      "PAYPAL_TOKEN_FAILED",
      "No se pudo autenticar con PayPal."
    );
  }

  const data = await paypalResponse.json();
  return data.access_token;
}

async function capturePayPalOrder({ accessToken, paypalOrderId }) {
  const paypalResponse = await fetch(
    `${PAYPAL_BASE_URL}/v2/checkout/orders/${paypalOrderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
    }
  );

  if (!paypalResponse.ok) {
    const errorText = await paypalResponse.text();
    console.error("[paypal-capture-error]", errorText);

    throw appError(
      502,
      "PAYPAL_CAPTURE_FAILED",
      "PayPal no pudo capturar la orden."
    );
  }

  return paypalResponse.json();
}

function extractCaptureId(capture) {
  const purchaseUnit = capture?.purchase_units?.[0];
  const captureItem = purchaseUnit?.payments?.captures?.[0];

  return captureItem?.id || null;
}

async function updatePayment({
  paypalOrderId,
  estado,
  paypalCaptureId,
  rawCapture,
}) {
  const { data, error } = await supabase
    .from("pagos")
    .update({
      estado,
      paypal_capture_id: paypalCaptureId,
      metadata: {
        paypal_env: CONFIG.paypalEnv,
        raw_capture: rawCapture,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("paypal_order_id", paypalOrderId)
    .select()
    .single();

  if (error) {
    console.error("[supabase-payment-update-error]", error);

    throw appError(
      500,
      "PAYMENT_UPDATE_FAILED",
      "No se pudo actualizar el pago."
    );
  }

  return data;
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: HEADERS,
    body: JSON.stringify(body),
  };
}

function appError(statusCode, code, publicMessage) {
  const error = new Error(publicMessage);
  error.statusCode = statusCode;
  error.code = code;
  error.publicMessage = publicMessage;
  return error;
}