

'use client';

import React, { useState, useEffect, useRef, useTransition, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Paperclip, Send, Loader2, AlertCircle, RotateCcw, ChefHat, User } from 'lucide-react'; // Removed MessageSquare as it's not used
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { chatWithEva, type ChatWithEvaInput, type ChatMessage } from '@/ai/flows/chat-with-eva'; // Corrected import path
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LanguageCode } from '@/app/page'; // Import LanguageCode type

// Supported languages mapping (Code to Name) - Used for AI flow calls
const supportedLanguagesMap = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "hi": "Hindi",
    "bn": "Bengali",
    // Add more as needed
};

// UI Text translations (keyed by LanguageCode) - Removed token-related text
const uiText = {
  "en": {
    title: "Chat with Chef Eva",
    description: "Hi! I'm Chef Eva. How can I help you with your cooking today? You can ask questions, describe ingredients, or even upload a photo of food!",
    inputPlaceholder: "Ask Eva anything about cooking...",
    attachLabel: "Attach Image",
    attachLimit: "(Max 2MB, JPEG/PNG)",
    sendButton: "Send",
    sendingButton: "Sending...",
    chatErrorTitle: "Chat Error",
    chatErrorGeneric: "An error occurred while chatting. Please try again.",
    chatErrorResponseFormat: "Received an unexpected response format from the chef.",
    imageUploadErrorTitle: "Image Error",
    imageUploadErrorSize: "Image size exceeds the 2MB limit.",
    imageUploadErrorType: "Invalid file type. Please upload JPEG or PNG images.",
    imageUploadErrorRead: "Could not read the image file.",
    // tokensRemaining: "Tokens Remaining: {count}", // Removed
    // noTokensTitle: "Out of Tokens", // Removed
    // noTokensDesc: "You have used all your Chef Eva chat tokens for today. Tokens reset daily.", // Removed
    resetChatButton: "Reset Chat",
    resetChatConfirmTitle: "Reset Chat?",
    resetChatConfirmDesc: "Are you sure you want to clear the chat history? This action cannot be undone.",
    resetChatCancel: "Cancel",
    resetChatConfirm: "Reset",
    selectLanguage: "Response Language",
  },
  "es": {
    title: "Chatea con Chef Eva",
    description: "¡Hola! Soy Chef Eva. ¿Cómo puedo ayudarte con la cocina hoy? ¡Puedes hacer preguntas, describir ingredientes o incluso subir una foto de comida!",
    inputPlaceholder: "Pregúntale a Eva cualquier cosa sobre cocina...",
    attachLabel: "Adjuntar Imagen",
    attachLimit: "(Máx 2MB, JPEG/PNG)",
    sendButton: "Enviar",
    sendingButton: "Enviando...",
    chatErrorTitle: "Error de Chat",
    chatErrorGeneric: "Ocurrió un error al chatear. Por favor, inténtalo de nuevo.",
    chatErrorResponseFormat: "Se recibió un formato de respuesta inesperado del chef.",
    imageUploadErrorTitle: "Error de Imagen",
    imageUploadErrorSize: "El tamaño de la imagen excede el límite de 2MB.",
    imageUploadErrorType: "Tipo de archivo inválido. Sube imágenes JPEG o PNG.",
    imageUploadErrorRead: "No se pudo leer el archivo de imagen.",
    // tokensRemaining: "Tokens Restantes: {count}", // Removed
    // noTokensTitle: "Sin Tokens", // Removed
    // noTokensDesc: "Has usado todos tus tokens de chat de Chef Eva por hoy. Los tokens se restablecen diariamente.", // Removed
    resetChatButton: "Restablecer Chat",
    resetChatConfirmTitle: "¿Restablecer Chat?",
    resetChatConfirmDesc: "¿Estás seguro de que quieres borrar el historial del chat? Esta acción no se puede deshacer.",
    resetChatCancel: "Cancelar",
    resetChatConfirm: "Restablecer",
    selectLanguage: "Idioma de Respuesta",
  },
  "fr": {
    title: "Discutez avec Chef Eva",
    description: "Salut ! Je suis Chef Eva. Comment puis-je vous aider en cuisine aujourd'hui ? Vous pouvez poser des questions, décrire des ingrédients ou même télécharger une photo de plat !",
    inputPlaceholder: "Demandez n'importe quoi à Eva sur la cuisine...",
    attachLabel: "Joindre une Image",
    attachLimit: "(Max 2 Mo, JPEG/PNG)",
    sendButton: "Envoyer",
    sendingButton: "Envoi...",
    chatErrorTitle: "Erreur de Chat",
    chatErrorGeneric: "Une erreur s'est produite lors du chat. Veuillez réessayer.",
    chatErrorResponseFormat: "Format de réponse inattendu reçu du chef.",
    imageUploadErrorTitle: "Erreur d'Image",
    imageUploadErrorSize: "La taille de l'image dépasse la limite de 2 Mo.",
    imageUploadErrorType: "Type de fichier invalide. Veuillez télécharger des images JPEG ou PNG.",
    imageUploadErrorRead: "Impossible de lire le fichier image.",
    // tokensRemaining: "Jetons Restants : {count}", // Removed
    // noTokensTitle: "Plus de Jetons", // Removed
    // noTokensDesc: "Vous avez utilisé tous vos jetons de chat Chef Eva pour aujourd'hui. Les jetons se réinitialisent quotidiennement.", // Removed
    resetChatButton: "Réinitialiser le Chat",
    resetChatConfirmTitle: "Réinitialiser le Chat ?",
    resetChatConfirmDesc: "Êtes-vous sûr de vouloir effacer l'historique du chat ? Cette action est irréversible.",
    resetChatCancel: "Annuler",
    resetChatConfirm: "Réinitialiser",
    selectLanguage: "Langue de Réponse",
  },
  "de": {
    title: "Chatten Sie mit Chef Eva",
    description: "Hallo! Ich bin Chef Eva. Wie kann ich Ihnen heute beim Kochen helfen? Sie können Fragen stellen, Zutaten beschreiben oder sogar ein Foto von Essen hochladen!",
    inputPlaceholder: "Fragen Sie Eva alles über das Kochen...",
    attachLabel: "Bild anhängen",
    attachLimit: "(Max 2MB, JPEG/PNG)",
    sendButton: "Senden",
    sendingButton: "Sende...",
    chatErrorTitle: "Chat-Fehler",
    chatErrorGeneric: "Beim Chatten ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
    chatErrorResponseFormat: "Unerwartetes Antwortformat vom Koch erhalten.",
    imageUploadErrorTitle: "Bildfehler",
    imageUploadErrorSize: "Die Bildgröße überschreitet das 2MB-Limit.",
    imageUploadErrorType: "Ungültiger Dateityp. Bitte laden Sie JPEG- or PNG-Bilder hoch.",
    imageUploadErrorRead: "Die Bilddatei konnte nicht gelesen werden.",
    // tokensRemaining: "Verbleibende Tokens: {count}", // Removed
    // noTokensTitle: "Keine Tokens mehr", // Removed
    // noTokensDesc: "Sie haben alle Ihre Chef Eva Chat-Tokens für heute verbraucht. Tokens werden täglich zurückgesetzt.", // Removed
    resetChatButton: "Chat zurücksetzen",
    resetChatConfirmTitle: "Chat zurücksetzen?",
    resetChatConfirmDesc: "Möchten Sie den Chatverlauf wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
    resetChatCancel: "Abbrechen",
    resetChatConfirm: "Zurücksetzen",
    selectLanguage: "Antwortsprache",
  },
  "hi": { // Hindi
    title: "शेफ ईवा के साथ चैट करें",
    description: "नमस्ते! मैं शेफ ईवा हूँ। आज मैं आपकी खाना पकाने में कैसे मदद कर सकती हूँ? आप सवाल पूछ सकते हैं, सामग्री का वर्णन कर सकते हैं, या भोजन की तस्वीर भी अपलोड कर सकते हैं!",
    inputPlaceholder: "ईवा से खाना पकाने के बारे में कुछ भी पूछें...",
    attachLabel: "छवि संलग्न करें",
    attachLimit: "(अधिकतम 2MB, JPEG/PNG)",
    sendButton: "भेजें",
    sendingButton: "भेज रहा है...",
    chatErrorTitle: "चैट त्रुटि",
    chatErrorGeneric: "चैट करते समय एक त्रुटि हुई। कृपया पुन: प्रयास करें।",
    chatErrorResponseFormat: "शेफ से एक अप्रत्याशित प्रतिक्रिया प्रारूप प्राप्त हुआ।",
    imageUploadErrorTitle: "छवि त्रुटि",
    imageUploadErrorSize: "छवि का आकार 2MB सीमा से अधिक है।",
    imageUploadErrorType: "अमान्य फ़ाइल प्रकार। कृपया JPEG या PNG छवियां अपलोड करें।",
    imageUploadErrorRead: "छवि फ़ाइल पढ़ने में असमर्थ।",
    // tokensRemaining: "शेष टोकन: {count}", // Removed
    // noTokensTitle: "टोकन समाप्त", // Removed
    // noTokensDesc: "आपने आज के लिए अपने सभी शेफ ईवा चैट टोकन का उपयोग कर लिया है। टोकन प्रतिदिन रीसेट होते हैं।", // Removed
    resetChatButton: "चैट रीसेट करें",
    resetChatConfirmTitle: "चैट रीसेट करें?",
    resetChatConfirmDesc: "क्या आप वाकई चैट इतिहास साफ़ करना चाहते हैं? यह क्रिया वापस नहीं की जा सकती।",
    resetChatCancel: "रद्द करें",
    resetChatConfirm: "रीसेट करें",
    selectLanguage: "प्रतिक्रिया भाषा",
  },
  "bn": { // Bengali
    title: "শেফ ইভার সাথে চ্যাট করুন",
    description: "হাই! আমি শেফ ইভা। আজ আমি আপনার রান্নায় কীভাবে সাহায্য করতে পারি? আপনি প্রশ্ন জিজ্ঞাসা করতে পারেন, উপাদান বর্ণনা করতে পারেন, বা এমনকি খাবারের ছবি আপলোড করতে পারেন!",
    inputPlaceholder: "ইভাকে রান্না সম্পর্কে কিছু জিজ্ঞাসা করুন...",
    attachLabel: "ছবি সংযুক্ত করুন",
    attachLimit: "(সর্বোচ্চ ২MB, JPEG/PNG)",
    sendButton: "পাঠান",
    sendingButton: "পাঠানো হচ্ছে...",
    chatErrorTitle: "চ্যাট ত্রুটি",
    chatErrorGeneric: "চ্যাট করার সময় একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
    chatErrorResponseFormat: "শেফের কাছ থেকে একটি অপ্রত্যাশিত প্রতিক্রিয়া ফর্ম্যাট প্রাপ্ত হয়েছে।",
    imageUploadErrorTitle: "ছবির ত্রুটি",
    imageUploadErrorSize: "ছবির আকার ২MB সীমা অতিক্রম করেছে।",
    imageUploadErrorType: "অবৈধ ফাইলের ধরণ। অনুগ্রহ করে JPEG বা PNG ছবি আপলোড করুন।",
    imageUploadErrorRead: "ছবির ফাইল পড়া যায়নি।",
    // tokensRemaining: "অবশিষ্ট টোকেন: {count}", // Removed
    // noTokensTitle: "টোকেন নেই", // Removed
    // noTokensDesc: "আপনি আজকের জন্য আপনার সমস্ত শেফ ইভা চ্যাট টোকেন ব্যবহার করেছেন। টোকেন প্রতিদিন রিসেট হয়।", // Removed
    resetChatButton: "চ্যাট রিসেট করুন",
    resetChatConfirmTitle: "চ্যাট রিসেট করবেন?",
    resetChatConfirmDesc: "আপনি কি নিশ্চিতভাবে চ্যাট ইতিহাস মুছে ফেলতে চান? এই ক্রিয়াটি পূর্বাবস্থায় ফেরানো যাবে না।",
    resetChatCancel: "বাতিল করুন",
    resetChatConfirm: "রিসেট করুন",
    selectLanguage: "প্রতিক্রিয়া ভাষা",
  },
};


interface ChatEvaProps {
  isOpen: boolean;
  onClose: () => void;
  language: LanguageCode;
  userId: string; // Receive userId (though not used for tokens now)
}

// Helper to estimate tokens (simple word count, refine as needed)
const estimateTokens = (text: string): number => {
    return text ? text.split(/\s+/).length : 0;
};

// Max context tokens to send (adjust based on model limits and desired history length)
const MAX_CONTEXT_TOKENS = 50000; // Increased context limit

export function ChatEva({ isOpen, onClose, language: initialLanguage, userId }: ChatEvaProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  // const [tokensLeft, setTokensLeft] = useState<number | null>(null); // Removed token state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(initialLanguage);

  const T = uiText[currentLanguage] || uiText.en; // Use currentLanguage for UI text

  // --- Initialize Chat ---
  useEffect(() => {
      if (isOpen) {
          // Add initial message if chat is empty
          if (messages.length === 0) {
              setMessages([{ role: 'model', parts: [{ text: T.description }] }]);
          }
      }
  }, [isOpen, T.description, messages.length]); // Removed userId dependency


  // --- Language Sync & Reset ---
  useEffect(() => {
    setCurrentLanguage(initialLanguage);
  }, [initialLanguage]);

  useEffect(() => {
    // Reset messages when language changes in the main app, if the chat is open
    if (isOpen && messages.length > 1) { // Only reset if there's actual history
        handleResetChatConfirm(); // Use the reset logic
    } else if (isOpen && messages.length <= 1) {
        // Update initial message language if chat is empty/just opened
         setMessages([{ role: 'model', parts: [{ text: uiText[initialLanguage].description }] }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLanguage, isOpen]); // Only run when language or open state changes


  // --- Scrolling ---
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  // --- Image Handling ---
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast({ variant: "destructive", title: T.imageUploadErrorTitle, description: T.imageUploadErrorSize });
      return;
    }
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast({ variant: "destructive", title: T.imageUploadErrorTitle, description: T.imageUploadErrorType });
      return;
    }

    // Read and set image data
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageDataUri(result); // Store the data URI
    };
    reader.onerror = () => {
      toast({ variant: "destructive", title: T.imageUploadErrorTitle, description: T.imageUploadErrorRead });
      setImagePreview(null);
      setImageDataUri(null);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageDataUri(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset file input
    }
  };

  // --- Message Sending ---
  const handleSend = useCallback(async () => {
    const currentInput = input.trim();
    if (!currentInput && !imageDataUri) return;
    // Removed token check

    setError(null);

    const userMessageParts: { text?: string; media?: { url: string; contentType?: string } }[] = [];
    if (currentInput) {
        userMessageParts.push({ text: currentInput });
    }
    if (imageDataUri) {
        // Extract mime type and base64 data
        const match = imageDataUri.match(/^data:(image\/(?:jpeg|png));base64,(.*)$/);
        if (match && match[1] && match[2]) {
             userMessageParts.push({ media: { url: imageDataUri, contentType: match[1] } });
        } else {
             console.error("Invalid data URI format");
             toast({ variant: "destructive", title: T.imageUploadErrorTitle, description: "Invalid image format."});
             return; // Don't send if image format is wrong
        }
    }

    const newMessage: ChatMessage = { role: 'user', parts: userMessageParts };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages); // Show user message immediately

    // Clear input fields after capturing their values
    setInput('');
    removeImage(); // Clear image preview and data URI


     // --- Prepare history for AI, limiting context size ---
     let tokenCount = 0;
     const historyToSend: ChatMessage[] = [];
     // Iterate backwards through messages to prioritize recent ones
     for (let i = updatedMessages.length - 1; i >= 0; i--) {
         const msg = updatedMessages[i];
         let msgTokens = 0;
         msg.parts.forEach(part => {
             if (part.text) {
                 msgTokens += estimateTokens(part.text);
             }
             // Add a fixed token count for images, or implement more complex estimation
             if (part.media) {
                 msgTokens += 100; // Example: Assign 100 tokens per image
             }
         });

         if (tokenCount + msgTokens <= MAX_CONTEXT_TOKENS) {
             historyToSend.unshift(msg); // Add to beginning to maintain order
             tokenCount += msgTokens;
         } else {
             break; // Stop adding messages once limit is reached
         }
     }
     // Always include the latest user message if possible, even if slightly over limit
      if (!historyToSend.some(m => m === newMessage) && updatedMessages.length > 0) {
          const lastUserMsg = updatedMessages[updatedMessages.length - 1];
           if (lastUserMsg.role === 'user') {
              historyToSend.push(lastUserMsg); // Ensure the very last message is sent
           }
      }


    startTransition(async () => {
      try {

        // Removed token decrement request

        // --- Call AI Flow ---
        const flowInput: ChatWithEvaInput = {
            history: historyToSend.slice(0, -1), // Send history *before* the current message
            message: { // Send the current message separately
                 text: currentInput || undefined, // Ensure text is undefined if empty
                 // Pass image as data URI string or undefined, ensuring it's a string if present
                 image: imageDataUri ? imageDataUri : undefined,
            },
             language: supportedLanguagesMap[currentLanguage] || 'English', // Pass full language name
        };

        const result = await chatWithEva(flowInput);

        if (result && result.response) {
             setMessages(prev => [...prev, { role: 'model', parts: [{ text: result.response }] }]);
         } else {
             throw new Error(T.chatErrorResponseFormat);
         }

      } catch (err) {
        console.error("Chat Error:", err);
        let errorMsg = T.chatErrorGeneric;
         if (err instanceof Error) {
            // Check for specific schema validation error message structure
             if (err.message.includes("Schema validation failed") || err.message.includes("Parse Errors")) {
                 errorMsg = `${T.chatErrorTitle}: ${err.message}`; // Show detailed schema error
             } else {
                errorMsg = `${T.chatErrorTitle}: ${err.message}`;
             }
         }
        setError(errorMsg);
        // Revert optimistic update on error
        setMessages(messages);
         // Removed token refund logic
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, imageDataUri, messages, userId, currentLanguage, T]); // Removed tokensLeft dependency

  // --- Reset Chat ---
  const handleResetChat = () => {
    setShowResetConfirm(true);
  };

  const handleResetChatConfirm = () => {
      setMessages([{ role: 'model', parts: [{ text: T.description }] }]); // Reset to initial message
      setInput('');
      removeImage();
      setError(null);
      setShowResetConfirm(false);
      // Note: Tokens are NOT reset here.
  };

  const handleResetChatCancel = () => {
    setShowResetConfirm(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-primary" />
            {T.title}
          </DialogTitle>
           {/* Language Selector */}
            <div className="flex items-center gap-2 pt-2">
                <Label htmlFor="eva-language" className="text-sm text-muted-foreground whitespace-nowrap">{T.selectLanguage}:</Label>
                <Select value={currentLanguage} onValueChange={(value) => setCurrentLanguage(value as LanguageCode)}>
                    <SelectTrigger id="eva-language" className="w-auto h-8 text-sm bg-background">
                        <SelectValue placeholder={T.selectLanguage} />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(supportedLanguagesMap).map(([code, name]) => (
                            <SelectItem key={code} value={code}>{name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
           {/* Token Display Removed */}
        </DialogHeader>

        <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && (
                  <Avatar className="w-8 h-8 border border-primary/20">
                    <AvatarImage src="/chef-eva-avatar.png" alt="Chef Eva" data-ai-hint="female chef avatar cartoon"/>
                    <AvatarFallback>CE</AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[75%] space-y-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.parts.map((part, partIndex) => (
                        <div key={partIndex} className={`rounded-lg px-3 py-2 shadow-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                             {part.text && <p className="text-sm whitespace-pre-wrap">{part.text}</p>}
                             {part.media && part.media.url.startsWith('data:image') && (
                                 // eslint-disable-next-line @next/next/no-img-element
                                 <img src={part.media.url} alt="Uploaded content" className="rounded-md max-w-full h-auto max-h-60 mt-2" />
                             )}
                        </div>
                    ))}
                </div>
                {msg.role === 'user' && (
                  <Avatar className="w-8 h-8 border border-muted-foreground/20">
                     <AvatarFallback><User className="h-4 w-4"/></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
             {/* Loading Indicator */}
            {isSending && (
                <div className="flex justify-start gap-3">
                    <Avatar className="w-8 h-8 border border-primary/20">
                       <AvatarImage src="/chef-eva-avatar.png" alt="Chef Eva" />
                       <AvatarFallback>CE</AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg px-3 py-2 bg-muted shadow-sm flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>

        {/* Error Display */}
        {error && (
            <div className="px-4 pb-2">
                <Alert variant="destructive" className="text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {/* Removed token-specific title */}
                    <AlertTitle>{T.chatErrorTitle}</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        )}

         {/* Image Preview */}
         {imagePreview && (
            <div className="px-4 pt-2 border-t relative">
                <p className="text-xs text-muted-foreground mb-1">{T.attachLabel}</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="max-h-20 w-auto rounded-md border" />
                <Button variant="ghost" size="sm" onClick={removeImage} className="absolute top-1 right-2 text-muted-foreground hover:text-destructive h-6 px-1">
                   &times; {/* Simple 'x' for removal */}
                </Button>
            </div>
         )}

        <DialogFooter className="p-4 border-t flex-row items-center gap-2">
            {/* Reset Button */}
            <Button variant="ghost" size="icon" onClick={handleResetChat} disabled={isSending || messages.length <= 1} title={T.resetChatButton}>
               <RotateCcw className="h-4 w-4 text-muted-foreground"/>
            </Button>
             {/* Attach Button */}
            <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isSending /* Removed token check */}>
                 <Paperclip className="h-4 w-4" />
                 <span className="sr-only">{T.attachLabel}</span>
            </Button>
             <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/jpeg, image/png"
                className="hidden"
             />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={T.inputPlaceholder}
            className="flex-grow"
            onKeyDown={(e) => e.key === 'Enter' && !isSending && handleSend()}
            disabled={isSending /* Removed token check */}
          />
          <Button onClick={handleSend} disabled={isSending || (!input.trim() && !imageDataUri) /* Removed token check */} className="min-w-[80px]">
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">{isSending ? T.sendingButton : T.sendButton}</span>
          </Button>
        </DialogFooter>
      </DialogContent>

       {/* Reset Confirmation Dialog */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
           <DialogContent className="sm:max-w-[425px]">
               <DialogHeader>
                   <DialogTitle>{T.resetChatConfirmTitle}</DialogTitle>
                   <DialogDescription>{T.resetChatConfirmDesc}</DialogDescription>
               </DialogHeader>
               <DialogFooter>
                   <Button variant="outline" onClick={handleResetChatCancel}>{T.resetChatCancel}</Button>
                   <Button variant="destructive" onClick={handleResetChatConfirm}>{T.resetChatConfirm}</Button>
               </DialogFooter>
           </DialogContent>
      </Dialog>
    </Dialog>
  );
}

