import { Resend } from "resend";
import { clerkClient } from "@clerk/nextjs/server";

const resend = new Resend(process.env.RESEND_API_KEY!);

// Shape returned by createOrder / getUserOrders
interface OrderWithItems {
  id: number;
  shipping: number;
  discountCode?: string | null;
  discountAmount: number;
  items: {
    id: number;
    size: string;
    amount: number;
    product: { title: string; tamil: string };
  }[];
}

function money(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function buildHtml(
  order: OrderWithItems,
  toName: string
): string {
  const subtotal = order.items.reduce((s, i) => s + i.amount, 0);
  const discount = order.discountAmount;
  const total    = subtotal + order.shipping - discount;

  const itemRows = order.items.map((item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #e4e0d6;font-size:14px;color:#1a1713;">
        <strong>${item.product.title}</strong>&nbsp;
        <span style="font-family:monospace;font-size:11px;color:#6e6455;">${item.product.tamil}</span><br/>
        <span style="font-size:12px;color:#6e6455;font-family:monospace;">Size: ${item.size}</span>
      </td>
      <td style="padding:12px 0 12px 16px;border-bottom:1px solid #e4e0d6;font-size:14px;color:#1a1713;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums;">
        ${money(item.amount)}
      </td>
    </tr>
  `).join("");

  const discountRow = discount > 0 && order.discountCode ? `
    <tr>
      <td style="padding:6px 0;font-size:13px;color:#e8452c;">Discount (${order.discountCode})</td>
      <td style="padding:6px 0;font-size:13px;color:#e8452c;text-align:right;">−${money(discount)}</td>
    </tr>
  ` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4ecdc;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4ecdc;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

  <!-- Header -->
  <tr><td style="background:#1a1713;padding:24px 28px;border-radius:4px 4px 0 0;">
    <p style="margin:0;font-size:22px;font-weight:700;color:#f4ecdc;letter-spacing:.04em;">BOTTLEMOODI</p>
    <p style="margin:4px 0 0;font-size:11px;color:#a0b499;font-family:monospace;letter-spacing:.12em;">ORDER CONFIRMED</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#ffffff;padding:28px 28px 24px;">
    <p style="margin:0 0 4px;font-size:24px;font-weight:700;color:#1a1713;">Sari da! 🎉</p>
    <p style="margin:0 0 22px;font-size:15px;color:#453d33;line-height:1.65;">
      Hey ${toName}, your order is confirmed. We'll dispatch it in
      <strong>3 working days</strong> and send tracking by SMS.
    </p>

    <!-- Order ref -->
    <div style="background:#f4ecdc;border-left:3px solid #e8452c;padding:12px 16px;margin-bottom:24px;border-radius:0 4px 4px 0;">
      <p style="margin:0;font-size:10px;color:#6e6455;font-family:monospace;letter-spacing:.12em;">ORDER REFERENCE</p>
      <p style="margin:5px 0 0;font-size:20px;font-weight:700;color:#1a1713;font-family:monospace;">#BM-${order.id}</p>
    </div>

    <!-- Items -->
    <p style="margin:0 0 6px;font-size:10px;color:#6e6455;font-family:monospace;letter-spacing:.12em;">YOUR ITEMS</p>
    <table width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>

    <!-- Totals -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
      <tr>
        <td style="padding:5px 0;font-size:13px;color:#6e6455;">Subtotal</td>
        <td style="padding:5px 0;font-size:13px;color:#6e6455;text-align:right;">${money(subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:5px 0;font-size:13px;color:#6e6455;">Shipping</td>
        <td style="padding:5px 0;font-size:13px;color:#6e6455;text-align:right;">${money(order.shipping)}</td>
      </tr>
      ${discountRow}
      <tr>
        <td style="padding:12px 0 0;font-size:17px;font-weight:700;color:#1a1713;border-top:2px solid #1a1713;">TOTAL</td>
        <td style="padding:12px 0 0;font-size:17px;font-weight:700;color:#1a1713;border-top:2px solid #1a1713;text-align:right;">${money(total)}</td>
      </tr>
    </table>

    <hr style="border:none;border-top:1px solid #e4e0d6;margin:24px 0;"/>
    <p style="margin:0;font-size:13px;color:#6e6455;line-height:1.6;">
      Questions? Reply to this email or DM us on
      <a href="https://www.instagram.com/bottle_moodi" style="color:#e8452c;text-decoration:none;">@bottle_moodi</a>.
    </p>
  </td></tr>

  <!-- CTA -->
  <tr><td style="background:#e8452c;padding:20px 28px;text-align:center;">
    <a href="https://bottlemoodi.com/my-orders"
       style="display:inline-block;background:#1a1713;color:#f4ecdc;font-size:14px;font-weight:700;
              padding:12px 28px;border-radius:3px;text-decoration:none;letter-spacing:.05em;">
      VIEW MY ORDERS
    </a>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:16px 28px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#a89e8e;font-family:monospace;">
      Mood-க்கு ஏத்த Design · Bottle Moodi
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function sendOrderConfirmationEmail(
  order: OrderWithItems,
  clerkUserId: string
): Promise<void> {
  // Fetch user details from Clerk
  const client    = await clerkClient();
  const clerkUser = await client.users.getUser(clerkUserId);
  const toEmail   = clerkUser.emailAddresses[0]?.emailAddress;
  if (!toEmail) return; // no email address on file — skip silently

  const firstName = clerkUser.firstName ?? "";
  const lastName  = clerkUser.lastName  ?? "";
  const toName    = [firstName, lastName].filter(Boolean).join(" ") ||
                    toEmail.split("@")[0];

  const subtotal = order.items.reduce((s, i) => s + i.amount, 0);
  const discount = order.discountAmount;
  const total    = subtotal + order.shipping - discount;

  await resend.emails.send({
    from:    "Bottle Moodi <orders@updates.bottlemoodi.com>",
    to:      toEmail,
    subject: `Order #BM-${order.id} confirmed — ${money(total)} · Your wall is about to get louder`,
    html:    buildHtml(order, toName),
  });
}
