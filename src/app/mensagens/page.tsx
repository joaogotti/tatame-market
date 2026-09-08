import { ImageOff, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

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
  created_at: string;
};

type DatabaseMessage = {
  conversation_id: string;
  content: string;
  created_at: string;
};

type DatabaseProduct = {
  id: string | number;
  title: string;
};

type DatabaseProductImage = ProductImageRecord & {
  product_id: string | number;
};

function formatConversationDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function identifyOtherParty(conversation: DatabaseConversation, userId: string) {
  const userIsBuyer = conversation.buyer_id === userId;
  const otherId = userIsBuyer
    ? conversation.seller_id
    : conversation.buyer_id;
  const role = userIsBuyer ? "Vendedor" : "Comprador";

  return `${role} · ${otherId.slice(0, 8)}`;
}

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError && authError.name !== "AuthSessionMissingError") {
    console.error("Falha ao validar usuário na caixa de mensagens.", {
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
    .select("id,product_id,buyer_id,seller_id,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Falha ao carregar conversas.", {
      userId: user.id,
      code: error.code,
      message: error.message,
    });
    throw new Error("Não foi possível carregar suas conversas.");
  }

  // O RLS é a primeira barreira; a confirmação local evita renderizar uma
  // linha inesperada caso os dados retornados estejam inconsistentes.
  const conversations = (data as DatabaseConversation[]).filter(
    (conversation) =>
      conversation.buyer_id === user.id || conversation.seller_id === user.id,
  );

  const conversationIds = conversations.map((conversation) => conversation.id);
  const productIds = [
    ...new Set(conversations.map((conversation) => conversation.product_id)),
  ];
  const latestMessageByConversation = new Map<string, DatabaseMessage>();
  const productsById = new Map<string, DatabaseProduct>();
  const primaryImageByProduct = new Map<string, string>();

  if (conversations.length > 0) {
    const [messagesResult, productsResult] = await Promise.all([
      supabase
        .from("messages")
        .select("conversation_id,content,created_at")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false }),
      supabase.from("products").select("id,title").in("id", productIds),
    ]);

    if (messagesResult.error) {
      console.error("Falha ao carregar últimas mensagens em lote.", {
        userId: user.id,
        code: messagesResult.error.code,
        message: messagesResult.error.message,
      });
      throw new Error("Não foi possível carregar suas mensagens.");
    }

    if (productsResult.error) {
      console.error("Falha ao carregar produtos das conversas em lote.", {
        userId: user.id,
        code: productsResult.error.code,
        message: productsResult.error.message,
      });
      throw new Error("Não foi possível carregar os produtos das conversas.");
    }

    for (const message of messagesResult.data as DatabaseMessage[]) {
      if (!latestMessageByConversation.has(message.conversation_id)) {
        latestMessageByConversation.set(message.conversation_id, message);
      }
    }

    for (const product of productsResult.data as DatabaseProduct[]) {
      productsById.set(String(product.id), product);
    }

    if (productsResult.data.length > 0) {
      const { data: imageData, error: imageError } = await supabase
        .from("product_images")
        .select("product_id,storage_path,sort_order,is_primary")
        .in(
          "product_id",
          productsResult.data.map((product) => product.id),
        )
        .order("sort_order", { ascending: true });

      if (imageError) {
        console.error("Falha ao carregar imagens das conversas em lote.", {
          userId: user.id,
          code: imageError.code,
          message: imageError.message,
        });
        throw new Error("Não foi possível carregar as imagens das conversas.");
      }

      const imagesByProduct = new Map<string, DatabaseProductImage[]>();

      for (const image of imageData as DatabaseProductImage[]) {
        const productId = String(image.product_id);
        const images = imagesByProduct.get(productId) ?? [];
        images.push(image);
        imagesByProduct.set(productId, images);
      }

      for (const [productId, images] of imagesByProduct) {
        const primaryImage = sortProductImages(images)[0];

        if (primaryImage) {
          primaryImageByProduct.set(
            productId,
            getProductImagePublicUrl(supabase, primaryImage.storage_path),
          );
        }
      }
    }
  }

  const sortedConversations = [...conversations].sort((first, second) => {
    const firstDate =
      latestMessageByConversation.get(first.id)?.created_at ?? first.created_at;
    const secondDate =
      latestMessageByConversation.get(second.id)?.created_at ?? second.created_at;

    return new Date(secondDate).getTime() - new Date(firstDate).getTime();
  });

  return (
    <div className="w-full px-6 py-10">
      <header>
        <span className="text-sm font-medium text-[#58C447]">Sua conta</span>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Mensagens
        </h1>
        <p className="mt-3 text-zinc-400">
          Acompanhe suas conversas sobre os anúncios do Tatame Market.
        </p>
      </header>

      {sortedConversations.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-white/10 bg-zinc-900 px-6 py-12 text-center sm:px-8">
          <MessageCircle
            aria-hidden="true"
            size={40}
            className="mx-auto text-[#58C447]"
          />
          <h2 className="mt-4 text-xl font-semibold text-white">
            Você ainda não possui conversas.
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Abra um anúncio real e converse com o vendedor para começar.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-lg bg-[#58C447] px-5 py-3 font-semibold text-[#111412] transition hover:bg-[#6AD159]"
          >
            Explorar anúncios
          </Link>
        </section>
      ) : (
        <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
          <h2 className="sr-only">Suas conversas</h2>
          {sortedConversations.map((conversation) => {
            const productId = String(conversation.product_id);
            const product = productsById.get(productId);
            const imageUrl = primaryImageByProduct.get(productId);
            const latestMessage = latestMessageByConversation.get(conversation.id);
            const displayDate = latestMessage?.created_at ?? conversation.created_at;

            return (
              <Link
                key={conversation.id}
                href={`/mensagens/${encodeURIComponent(conversation.id)}`}
                className="flex gap-4 border-b border-white/10 p-4 transition last:border-b-0 hover:bg-white/[0.03] sm:p-5"
              >
                <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-zinc-950 sm:size-24">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <ImageOff
                      aria-hidden="true"
                      className="absolute inset-0 m-auto text-zinc-600"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-white">
                        {product?.title ?? "Produto indisponível"}
                      </h3>
                      <p className="mt-1 text-sm text-[#58C447]">
                        {identifyOtherParty(conversation, user.id)}
                      </p>
                    </div>
                    <time
                      dateTime={displayDate}
                      className="shrink-0 text-xs text-zinc-500"
                    >
                      {formatConversationDate(displayDate)}
                    </time>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-zinc-400">
                    {latestMessage?.content ?? "Conversa iniciada. Envie uma mensagem."}
                  </p>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}
