import QRCode from "qrcode";

/** Server-rendered QR code for a claim link, so a demo audience can claim from their own phone. */
export async function ClaimQr({ url, name }: { url: string; name: string }) {
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#151922", light: "#ffffff" } });
  const local = /^https?:\/\/(localhost|127\.|0\.0\.0\.0)/.test(url);
  return (
    <div className="mt-3 flex items-center gap-3">
      <div
        role="img"
        aria-label={`QR code for ${name}'s claim link`}
        className="size-28 shrink-0 overflow-hidden rounded-md border bg-white p-1 [&_svg]:size-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="text-xs text-muted">
        Scan with your phone camera to see exactly what {name.split(" ")[0]} gets, and claim it.
        {local ? " (This link points to localhost, so it only opens on this computer.)" : null}
      </p>
    </div>
  );
}
