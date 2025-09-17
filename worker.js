export default {
    async fetch(request, env, ctx) {
        if (request.method === "POST") {
            const formData = await request.formData();
            const nombre = formData.get("nombre") || formData.get("name") || "Anónimo";
            const email = formData.get("email") || formData.get("correo");
            const mensaje = formData.get("mensaje") || formData.get("message") || "";
            const telefono = formData.get("telefono") || formData.get("phone") || "No proporcionado";
            const service = formData.get("service") || formData.get("servicio") || "No proporcionado";

            const clientTemplate = await env.EMAIL_TEMPLATE_BUCKET.get("client-template.html");
            if (!clientTemplate) {
                return new Response("No se encontró el template", { status: 500 });
            }

            const adminTemplate = await env.EMAIL_TEMPLATE_BUCKET.get("admin-template.html");
            if (!adminTemplate) {
                return new Response("No se encontró el template", { status: 500 });
            }

            if (!email || !nombre) {
                return new Response("Faltan campos obligatorios", { status: 400 });
            }

            const url = env.SMTP2GO_URL;

            // ENVIAR AL CLIENTE
            const clientTemplateText = await clientTemplate.text();
            await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    api_key: env.SMTP2GO_API_KEY,
                    to: [email],
                    sender: env.FROM_EMAIL,
                    subject: "Gracias por contactarnos",
                    html_body: clientTemplateText,
                }),
            });

            // ENVIAR AL ADMIN
            const adminTemplateText = await adminTemplate.text();
            const htmlAdmin = adminTemplateText
                .replace("{{nombre}}", nombre)
                .replace("{{email}}", email)
                .replace("{{mensaje}}", mensaje)
                .replace("{{telefono}}", telefono)
                .replace("{{servicio}}", service);

            await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    api_key: env.SMTP2GO_API_KEY,
                    to: [env.ADMIN_EMAIL],
                    sender: env.FROM_EMAIL,
                    subject: `Nuevo mensaje de ${nombre}`,
                    html_body: htmlAdmin,
                }),
            });

            return new Response("✅ Mensajes enviados", { status: 200 });

        }

        return new Response("Método no permitido", { status: 405 });
    },
};
