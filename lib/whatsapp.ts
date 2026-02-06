import crypto from "crypto";
import { getServerEnv } from "@/lib/env";

export function verifySignature(rawBody: string, signatureHeader?: string | null) {
  const { WHATSAPP_APP_SECRET } = getServerEnv();
  if (!WHATSAPP_APP_SECRET) {
    return true;
  }
  if (!signatureHeader) {
    return false;
  }
  const [scheme, signature] = signatureHeader.split("=");
  if (scheme !== "sha256" || !signature) {
    return false;
  }
  const expected = crypto.createHmac("sha256", WHATSAPP_APP_SECRET).update(rawBody).digest("hex");
  if (signature.length !== expected.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function sendWhatsAppMessage(phoneNumberId: string, to: string, body: string) {
  const { WHATSAPP_ACCESS_TOKEN, WHATSAPP_API_VERSION } = getServerEnv();
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro WhatsApp API: ${response.status} ${errorText}`);
  }

  return response.json();
}
