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
    const productoId = String(input.producto_id || "lectura_umbral").trim();

    const producto = await getProduct(productoId);

    if (!producto) {
      return response(404, {
        ok: false,
        error: "PRODUCT_NOT_FOUND",
        message: "Producto no encontrado.",
      });
    }

    if (producto.estado !== "activo") {
      return response(400, {
        ok: false,
        error: "PRODUCT_INACTIVE",
        message: "Este producto no está disponible.",
      });
    }

    const accessToken = await getPayPalAccessToken();

    const order = await createPayPalOrder({
      accessToken,
      producto,
    });

    const pago = await savePendingPayment({
      producto,
      paypalOrderId: order.id,
      rawOrder: order,
    });

    return response(200, {
      ok: true,
      etapa: "paypal_order_created",
      paypal_env: CONFIG.paypalEnv,
      producto: {
        producto_id: producto.producto_id,
        nombre: producto.nombre,
        precio: producto.precio,
        moneda: producto.moneda,
        tirada_id: producto.tirada_id,
      },
      pago: {
        id: pago.id,
        estado: pago.estado,
        paypal_order_id: pago.paypal_order_id,
      },
      paypal: {
        order_id: order.id,
        status: order.status,
      },
    });
  } catch (error) {
    console.error("[paypal-create-order-error]", error);

    return response(error.statusCode || 500, {
      ok: false,
      error: error.code || "INTERNAL_ERROR",
      message: error.publicMessage || "No se pudo crear la orden de PayPal.",
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
  if (!rawBody) return {};

  try {
    return JSON.parse(rawBody);
  } catch {
    throw appError(400, "INVALID_JSON", "El cuerpo no es un JSON válido.");
  }
}

async function getProduct(productoId) {
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("producto_id", productoId)
    .single();

  if (error) {
    console.error("[supabase-product-error]", error);
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

async function createPayPalOrder({ accessToken, producto }) {
  const amountValue = Number(producto.precio).toFixed(2);

  const paypalResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: producto.producto_id,
          custom_id: producto.producto_id,
          description: producto.nombre,
          amount: {
            currency_code: producto.moneda || "USD",
            value: amountValue,
          },
        },
      ],
    }),
  });

  if (!paypalResponse.ok) {
    const errorText = await paypalResponse.text();
    console.error("[paypal-create-order-error]", errorText);

    throw appError(
      502,
      "PAYPAL_ORDER_FAILED",
      "No se pudo crear la orden en PayPal."
    );
  }

  return paypalResponse.json();
}

async function savePendingPayment({ producto, paypalOrderId, rawOrder }) {
  const insertPayload = {
    proveedor_pago: "paypal",
    tipo_pago: "one_time",
    producto_id: producto.producto_id,
    producto_nombre: producto.nombre,
    monto: producto.precio,
    moneda: producto.moneda || "USD",
    estado: "pendiente",
    paypal_order_id: paypalOrderId,
    metadata: {
      paypal_env: CONFIG.paypalEnv,
      raw_order: rawOrder,
      tirada_id: producto.tirada_id,
    },
  };

  const { data, error } = await supabase
    .from("pagos")
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error("[supabase-payment-insert-error]", error);

    throw appError(
      500,
      "PAYMENT_INSERT_FAILED",
      "No se pudo guardar el pago pendiente."
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