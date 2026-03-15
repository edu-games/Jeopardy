import QRCode from "qrcode";

/**
 * Generate a QR code as a data URL for a game join link
 */
export async function generateGameQRCode(
  gameCode: string,
  baseUrl: string,
): Promise<string> {
  const joinUrl = `${baseUrl}/game/${gameCode}/join`;

  try {
    const svgString = await QRCode.toString(joinUrl, {
      type: "svg",
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    const base64 = btoa(svgString);
    return `data:image/svg+xml;base64,${base64}`;
  } catch (error) {
    console.error("Failed to generate QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Generate a random game code
 */
export function generateGameCode(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed similar looking chars
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}
