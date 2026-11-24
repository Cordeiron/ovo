import React, { useEffect, useRef } from 'react';
import { CheckCheck, MessageCircle, Send } from 'lucide-react';

export interface ChatBubble {
  id: string;
  sender: 'owner' | 'rebeca';
  text: string;
  time: string;
}

interface WhatsAppFeedProps {
  messages: ChatBubble[];
  isOwnerTyping: boolean;
  quickReplies: string[];
  onQuickReply: (text: string) => void;
}

export const WhatsAppFeed: React.FC<WhatsAppFeedProps> = ({
  messages,
  isOwnerTyping,
  quickReplies,
  onQuickReply,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOwnerTyping]);

  return (
    <aside
      aria-label="Conversa no WhatsApp com o Dono do Ovo"
      className="flex flex-col bg-white border-2 border-[#1F2937] rounded-3xl overflow-hidden shadow-[0_6px_0_#1F2937] h-[440px] lg:h-[580px]"
    >
      {/* WhatsApp Contact Header */}
      <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3 shrink-0 border-b-2 border-[#1F2937]">
        <div className="w-10 h-10 rounded-full bg-[#FEF3C7] border-2 border-white flex items-center justify-center text-lg shrink-0">
          🥚
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display font-bold text-base leading-tight truncate">
            Dono do Ovo (Desesperado)
          </div>
          <div className="text-xs text-[#A7F3D0] truncate">
            {isOwnerTyping ? 'digitando...' : 'online · olhando o celular sem parar'}
          </div>
        </div>
        <MessageCircle className="w-5 h-5 text-[#A7F3D0] shrink-0" />
      </div>

      {/* Chat Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-[#EFEAE2]"
      >
        {messages.map((msg) => {
          const isRebeca = msg.sender === 'rebeca';
          return (
            <div
              key={msg.id}
              className={`flex ${isRebeca ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm border border-[#1F2937]/15 ${
                  isRebeca
                    ? 'bg-[#D9FDD3] text-[#111B21] rounded-tr-sm'
                    : 'bg-white text-[#111B21] rounded-tl-sm'
                }`}
              >
                <p className="text-[11px] font-bold text-[#075E54] mb-0.5">
                  {isRebeca ? 'Rebeca' : 'Dono do Ovo'}
                </p>
                <p className="leading-snug break-words">{msg.text}</p>
                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[#667781] font-mono tabular-nums">
                  <span>{msg.time}</span>
                  {isRebeca && <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]" />}
                </div>
              </div>
            </div>
          );
        })}

        {isOwnerTyping && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-tl-sm px-3.5 py-2 text-xs text-[#4B5563] border border-[#1F2937]/15">
              Dono do Ovo está digitando nervoso...
            </div>
          </div>
        )}
      </div>

      {/* Quick Reply Buttons for Rebeca */}
      <div className="p-2.5 bg-[#F0F2F5] border-t-2 border-[#1F2937] shrink-0">
        <p className="text-[11px] font-semibold text-[#4B5563] mb-1.5 px-1">
          Responder rápido como Rebeca (+15 pts):
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => onQuickReply(reply)}
              className="text-left text-xs font-medium px-2.5 py-2 rounded-xl bg-white hover:bg-[#DCFCE7] border border-[#1F2937]/30 text-[#1F2937] transition-colors cursor-pointer truncate flex items-center justify-between gap-1"
              title={reply}
            >
              <span className="truncate">{reply}</span>
              <Send className="w-3 h-3 shrink-0 text-[#075E54]" />
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
