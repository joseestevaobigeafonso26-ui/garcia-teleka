import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * Download seguro de livros digitais.
 * Só liberta o ficheiro se o pedido existir (código + telefone certos),
 * estiver pago e conter esse livro em versão digital.
 * Precisa de SUPABASE_SERVICE_ROLE_KEY (apenas no servidor).
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") ?? "";
  const phone = req.nextUrl.searchParams.get("phone") ?? "";
  const bookId = req.nextUrl.searchParams.get("book") ?? "";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anon) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 500 });
  }
  if (!service) {
    return NextResponse.json(
      {
        error:
          "Download indisponível: falta SUPABASE_SERVICE_ROLE_KEY no servidor (.env.local).",
      },
      { status: 500 }
    );
  }

  const publicClient = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await publicClient.rpc("get_order", {
    p_code: code,
    p_phone: phone,
  });
  const order = data as {
    status: string;
    items: { book_id: string | null; format: string }[];
  } | null;

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }
  if (!["paid", "preparing", "delivered"].includes(order.status)) {
    return NextResponse.json(
      { error: "O pagamento ainda não foi confirmado." },
      { status: 403 }
    );
  }
  const owns = order.items.some(
    (i) => i.book_id === bookId && i.format === "digital"
  );
  if (!owns) {
    return NextResponse.json(
      { error: "Este livro não faz parte do pedido." },
      { status: 403 }
    );
  }

  const admin = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: book } = await admin
    .from("books")
    .select("digital_path")
    .eq("id", bookId)
    .maybeSingle();

  if (!book?.digital_path) {
    return NextResponse.json(
      { error: "O ficheiro deste livro ainda não está disponível." },
      { status: 404 }
    );
  }

  const { data: signed, error } = await admin.storage
    .from("digital")
    .createSignedUrl(book.digital_path, 60, { download: true });

  if (error || !signed) {
    return NextResponse.json(
      { error: "Não foi possível gerar o download." },
      { status: 500 }
    );
  }
  return NextResponse.redirect(signed.signedUrl);
}
