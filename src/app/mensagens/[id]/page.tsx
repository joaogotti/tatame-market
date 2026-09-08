import { ImageOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { MessageForm } from "@/components/messages/MessageForm/MessageForm";
import { MessageRealtimeListener } from "@/components/messages/MessageRealtimeListener/MessageRealtimeListener";
import {
  getProductImagePublicUrl,
  sortProductImages,
  type ProductImageRecord,
} from "@/lib/productImages";
import { createClient } from "@/lib/supabase/server";

type DatabaseConversation = {
  id: string;
  product_id: string | number;
  buyer_id: string;
  seller_id: string;
};

type DatabaseProduct = {
  id: string | number;
  title: string;
};

type DatabaseMessage = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

function formatMessageDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError && authError.name !== "AuthSessionMissingError") {
    console.error("Falha ao validar usuário na conversa.", {
      conversationId: id,
      name: authError.name,
      message: authError.message,
    });
    throw new Error("Não foi possível validar sua sessão.");
  }

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("conversations")
    .select("id,product_id,buyer_id,seller_id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") {
      notFound();
    }

    console.error("Falha ao carregar conversa.", {
      conversationId: id,
      userId: user.id,
      code: error.code,
      message: error.message,
    });
    throw new Error("Não foi possível carregar esta conversa.");
  }

  const conversation = data as DatabaseConversation | null;

  if (
    !conversation ||
    (conversation.buyer_id !== user.id && conversation.seller_id !== user.id)
  ) {
    notFound();
  }

  const [productResult, messagesResult, imagesResult] = await Promise.all([
    supabase
      .from("products")
      .select("id,title")
      .eq("id", conversation.product_id)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("id,sender_id,content,created_at")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("product_images")
      .select("storage_path,sort_order,is_primary")
      .eq("product_id", conversation.product_id)
      .order("sort_order", { ascending: true }),
  ]);

  if (productResult.error) {
    console.error("Falha ao carregar produto da conversa.", {
      conversationId: id,
      productId: conversation.product_id,
      code: productResult.error.code,
      message: productResult.error.message,
    });
    throw new Error("Não foi possível carregar o produto desta conversa.");
  }

  if (messagesResult.error) {
    console.error("Falha ao carregar histórico da conversa.", {
      conversationId: id,
      userId: user.id,
      code: messagesResult.error.code,
      message: messagesResult.error.message,
    });
    throw new Error("Não foi possível carregar o histórico de mensagens.");
  }

  if (imagesResult.error) {
    console.error("Falha ao carregar imagem do produto da conversa.", {
      conversationId: id,
      productId: conversation.product_id,
      code: imagesResult.error.code,
      message: imagesResult.error.message,
    });
    throw new Error("Não foi possível carregar a imagem do produto.");
  }

  const product = productResult.data as DatabaseProduct | null;
  const messages = messagesResult.data as DatabaseMessage[];
  const primaryImage = sortProductImages(
    imagesResult.data as ProductImageRecord[],
  )[0];
  const imageUrl = primaryImage
    ? getProductImagePublicUrl(supabase, primaryImage.storage_path)
    : null;
  const userIsBuyer = conversation.buyer_id === user.id;
  const otherPartyId = userIsBuyer
    ? conversation.seller_id
    : conversation.buyer_id;
  const otherParty = `${userIsBuyer ? "Vendedor" : "Comprador"} · ${otherPartyId.slice(0, 8)}`;

  return (
    <div className="w-full px-6 py-10">
      <MessageRealtimeListener
        conversationId={conversation.id}
        visibleMessageIds={messages.map((message) => message.id)}
      />

      <Link
        href="/mensagens"
        className="text-sm font-medium text-[#58C447] transition hover:text-[#6AD159]"
      >
        ← Voltar para mensagens
      </Link>

      <section className="mt-5 max-w-[53rem] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
        <header className="flex items-center gap-4 border-b border-white/10 p-4 sm:p-6">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-zinc-950 sm:size-20">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <ImageOff
                aria-hidden="true"
                className="absolute inset-0 m-auto text-zinc-600"
              />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-white sm:text-2xl">
              {product?.title ?? "Produto indisponível"}
            </h1>
            <p className="mt-1 text-sm text-[#58C447]">{otherParty}</p>
            {product && (
              <Link
                href={`/produto/${encodeURIComponent(String(product.id))}`}
                className="mt-1 inline-block text-xs text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline"
              >
                Ver anúncio
              </Link>
            )}
          </div>
        </header>

        <div className="max-h-[60vh] min-h-80 space-y-4 overflow-y-auto bg-zinc-950/50 p-4 sm:p-6">
          {messages.length === 0 ? (
            <div className="flex min-h-64 items-center justify-center text-center">
              <div>
                <h2 className="font-semibold text-white">Comece a conversa</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Envie uma mensagem sobre este anúncio.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const wasSentByUser = message.sender_id === user.id;

              return (
                <article
                  key={message.id}
                  className={`flex ${wasSentByUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[70%] ${
                      wasSentByUser
                        ? "rounded-br-sm bg-[#58C447] text-[#111412]"
                        : "rounded-bl-sm border border-white/10 bg-zinc-800 text-zinc-100"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm">
                      {message.content}
                    </p>
                    <time
                      dateTime={message.created_at}
                      className={`mt-2 block text-right text-[11px] ${
                        wasSentByUser ? "text-[#1d4417]" : "text-zinc-500"
                      }`}
                    >
                      {formatMessageDate(message.created_at)}
                    </time>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <MessageForm conversationId={conversation.id} />
      </section>
    </div>
  );
}
