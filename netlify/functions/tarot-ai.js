const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {

  try {

    const { data, error } = await supabase
      .from("tarot_consultas")
      .select("*")
      .limit(1);

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        mensaje: "Conexión con Supabase correcta",
        data
      })
    };

  } catch (err) {

    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: err.message
      })
    };

  }

};