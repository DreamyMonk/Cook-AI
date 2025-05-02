
'use client';

import React, { useState, useEffect, useRef, useTransition, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'; // Keep Dialog imports
import {
  AlertDialog, // Import AlertDialog for reset confirmation
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'; // Correct import path
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Paperclip, Send, Loader2, AlertCircle, RotateCcw, ChefHat, User, MessageSquareWarning } from 'lucide-react'; // Added MessageSquareWarning
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

const MAX_MESSAGES = 30; // Define the message limit
const LOCAL_STORAGE_KEY_EVA_COUNT = 'chefEvaMessageCount';

// UI Text translations (keyed by LanguageCode)
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
    resetChatButton: "Reset Chat",
    resetChatConfirmTitle: "Reset Chat?",
    resetChatConfirmDesc: "Are you sure you want to clear the chat history? This action cannot be undone and will not reset your message count.", // Updated description
    resetChatCancel: "Cancel",
    resetChatConfirm: "Reset",
    selectLanguage: "Response Language",
    messagesRemaining: "Messages Remaining: {count}", // New text
    messageLimitReachedTitle: "Message Limit Reached", // New text
    messageLimitReachedDesc: "You have used your {limit} free messages. Please upgrade for unlimited chats.", // New text
    inputPlaceholderLimitReached: "Message limit reached.", // New placeholder
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
    resetChatButton: "Restablecer Chat",
    resetChatConfirmTitle: "¿Restablecer Chat?",
    resetChatConfirmDesc: "¿Estás seguro de que quieres borrar el historial del chat? Esta acción no se puede deshacer y no restablecerá tu cuenta de mensajes.",
    resetChatCancel: "Cancelar",
    resetChatConfirm: "Restablecer",
    selectLanguage: "Idioma de Respuesta",
    messagesRemaining: "Mensajes Restantes: {count}",
    messageLimitReachedTitle: "Límite de Mensajes Alcanzado",
    messageLimitReachedDesc: "Has usado tus {limit} mensajes gratuitos. Actualiza para chats ilimitados.",
    inputPlaceholderLimitReached: "Límite de mensajes alcanzado.",
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
    resetChatButton: "Réinitialiser le Chat",
    resetChatConfirmTitle: "Réinitialiser le Chat ?",
    resetChatConfirmDesc: "Êtes-vous sûr de vouloir effacer l'historique du chat ? Cette action est irréversible et ne réinitialisera pas votre compteur de messages.",
    resetChatCancel: "Annuler",
    resetChatConfirm: "Réinitialiser",
    selectLanguage: "Langue de Réponse",
    messagesRemaining: "Messages Restants : {count}",
    messageLimitReachedTitle: "Limite de Messages Atteinte",
    messageLimitReachedDesc: "Vous avez utilisé vos {limit} messages gratuits. Veuillez mettre à niveau pour des discussions illimitées.",
    inputPlaceholderLimitReached: "Limite de messages atteinte.",
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
    resetChatButton: "Chat zurücksetzen",
    resetChatConfirmTitle: "Chat zurücksetzen?",
    resetChatConfirmDesc: "Möchten Sie den Chatverlauf wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden und setzt Ihren Nachrichtenzähler nicht zurück.",
    resetChatCancel: "Abbrechen",
    resetChatConfirm: "Zurücksetzen",
    selectLanguage: "Antwortsprache",
    messagesRemaining: "Verbleibende Nachrichten: {count}",
    messageLimitReachedTitle: "Nachrichtenlimit erreicht",
    messageLimitReachedDesc: "Sie haben Ihre {limit} kostenlosen Nachrichten verbraucht. Bitte führen Sie ein Upgrade für unbegrenzte Chats durch.",
    inputPlaceholderLimitReached: "Nachrichtenlimit erreicht.",
  },
  "hi": {
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
    resetChatButton: "चैट रीसेट करें",
    resetChatConfirmTitle: "चैट रीसेट करें?",
    resetChatConfirmDesc: "क्या आप वाकई चैट इतिहास साफ़ करना चाहते हैं? यह क्रिया वापस नहीं की जा सकती और आपके संदेश गणना को रीसेट नहीं करेगी।",
    resetChatCancel: "रद्द करें",
    resetChatConfirm: "रीसेट करें",
    selectLanguage: "प्रतिक्रिया भाषा",
    messagesRemaining: "शेष संदेश: {count}",
    messageLimitReachedTitle: "संदेश सीमा समाप्त",
    messageLimitReachedDesc: "आपने अपने {limit} मुफ्त संदेशों का उपयोग कर लिया है। असीमित चैट के लिए कृपया अपग्रेड करें।",
    inputPlaceholderLimitReached: "संदेश सीमा समाप्त।",
  },
  "bn": {
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
    resetChatButton: "চ্যাট রিসেট করুন",
    resetChatConfirmTitle: "চ্যাট রিসেট করবেন?",
    resetChatConfirmDesc: "আপনি কি নিশ্চিতভাবে চ্যাট ইতিহাস মুছে ফেলতে চান? এই ক্রিয়াটি পূর্বাবস্থায় ফেরানো যাবে না এবং আপনার বার্তা গণনা রিসেট করবে না।",
    resetChatCancel: "বাতিল করুন",
    resetChatConfirm: "রিসেট করুন",
    selectLanguage: "প্রতিক্রিয়া ভাষা",
    messagesRemaining: "অবশিষ্ট বার্তা: {count}",
    messageLimitReachedTitle: "বার্তা সীমা শেষ",
    messageLimitReachedDesc: "আপনি আপনার {limit} বিনামূল্যে বার্তা ব্যবহার করেছেন। সীমাহীন চ্যাটের জন্য অনুগ্রহ করে আপগ্রেড করুন।",
    inputPlaceholderLimitReached: "বার্তা সীমা শেষ।",
  },
};


interface ChatEvaProps {
  isOpen: boolean;
  onClose: () => void;
  language: LanguageCode;
  userId: string;
}

// Helper to estimate tokens (simple word count, refine as needed)
const estimateTokens = (text: string): number => {
    return text ? text.split(/\s+/).length : 0;
};

// Max context tokens to send
const MAX_CONTEXT_TOKENS = 50000;

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
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(initialLanguage);
  const [messageCount, setMessageCount] = useState<number>(MAX_MESSAGES); // Initialize count
  const [limitReached, setLimitReached] = useState<boolean>(false); // State for limit

  const T = uiText[currentLanguage] || uiText.en;

  // --- Load and Persist Message Count ---
  useEffect(() => {
    const savedCount = localStorage.getItem(LOCAL_STORAGE_KEY_EVA_COUNT);
    const initialCount = savedCount ? parseInt(savedCount, 10) : MAX_MESSAGES;

    // Ensure the loaded count is a valid number and not negative
    if (!isNaN(initialCount) && initialCount >= 0) {
      setMessageCount(initialCount);
      setLimitReached(initialCount === 0);
    } else {
      // If invalid data in localStorage, reset to max
      setMessageCount(MAX_MESSAGES);
      setLimitReached(false);
      localStorage.setItem(LOCAL_STORAGE_KEY_EVA_COUNT, String(MAX_MESSAGES));
    }
  }, []);

  useEffect(() => {
    // Save count whenever it changes (and is valid)
    if (typeof messageCount === 'number' && messageCount >= 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY_EVA_COUNT, String(messageCount));
      setLimitReached(messageCount === 0);
    }
  }, [messageCount]);


  // --- Initialize Chat ---
  useEffect(() => {
      if (isOpen) {
          if (messages.length === 0) {
              setMessages([{ role: 'model', parts: [{ text: T.description }] }]);
          }
      }
  }, [isOpen, T.description, messages.length]);


  // --- Language Sync & Reset ---
  useEffect(() => {
    setCurrentLanguage(initialLanguage);
  }, [initialLanguage]);

  useEffect(() => {
    if (isOpen && messages.length > 1) {
        // Don't automatically reset on language change now, let user decide
        // handleResetChatConfirm(); // Commented out
    } else if (isOpen && messages.length <= 1) {
         setMessages([{ role: 'model', parts: [{ text: uiText[initialLanguage].description }] }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLanguage, isOpen]);


  // --- Scrolling ---
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  // --- Image Handling ---
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (limitReached) return; // Prevent image upload if limit reached
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
    if (limitReached) {
      toast({
        variant: "destructive",
        title: T.messageLimitReachedTitle,
        description: T.messageLimitReachedDesc.replace('{limit}', String(MAX_MESSAGES)),
      });
      return;
    }

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

        // Decrement message count immediately (optimistic update)
        const newCount = messageCount - 1;
        setMessageCount(newCount);

        // --- Call AI Flow ---
        const flowInput: ChatWithEvaInput = {
            history: historyToSend.slice(0, -1), // Send history *before* the current message
            message: { // Send the current message separately
                 text: currentInput || undefined, // Ensure text is undefined if empty
                 image: imageDataUri ? imageDataUri : undefined,
            },
             language: supportedLanguagesMap[currentLanguage] || 'English', // Pass full language name
        };

        const result = await chatWithEva(flowInput);

        if (result && result.response) {
             setMessages(prev => [...prev, { role: 'model', parts: [{ text: result.response }] }]);
         } else {
            // Revert count decrement if AI call failed structurally
            setMessageCount(messageCount);
            throw new Error(T.chatErrorResponseFormat);
         }

      } catch (err) {
        console.error("Chat Error:", err);
        let errorMsg = T.chatErrorGeneric;
         if (err instanceof Error) {
             if (err.message.includes("Schema validation failed") || err.message.includes("Parse Errors")) {
                 errorMsg = `${T.chatErrorTitle}: ${err.message}`;
             } else {
                errorMsg = `${T.chatErrorTitle}: ${err.message}`;
             }
         }
        setError(errorMsg);
        // Revert count decrement on error
        setMessageCount(messageCount);
        // Revert optimistic message update on error
        setMessages(messages);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, imageDataUri, messages, currentLanguage, T, messageCount, limitReached]); // Add messageCount and limitReached

  // --- Reset Chat ---
  const handleResetChat = () => {
    setShowResetConfirm(true); // Show confirmation dialog
  };

  const handleResetChatConfirm = () => {
      setMessages([{ role: 'model', parts: [{ text: T.description }] }]); // Reset to initial message
      setInput('');
      removeImage();
      setError(null);
      setShowResetConfirm(false);
      // NOTE: Message count is NOT reset here
  };

  const handleResetChatCancel = () => {
    setShowResetConfirm(false);
  };

  const remainingMessagesText = T.messagesRemaining.replace('{count}', String(messageCount < 0 ? 0 : messageCount));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-primary" />
            {T.title}
          </DialogTitle>
           {/* Language Selector & Message Count */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
                <div className="flex items-center gap-2">
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
                {/* Display Message Count */}
                 <div className="text-sm text-muted-foreground font-medium">
                    {remainingMessagesText}
                 </div>
            </div>
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
                    <AlertTitle>{T.chatErrorTitle}</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        )}
        {/* Limit Reached Display */}
        {limitReached && !isSending && (
             <div className="px-4 pb-2">
                <Alert variant="destructive" className="text-sm">
                    <MessageSquareWarning className="h-4 w-4" />
                    <AlertTitle>{T.messageLimitReachedTitle}</AlertTitle>
                    <AlertDescription>{T.messageLimitReachedDesc.replace('{limit}', String(MAX_MESSAGES))}</AlertDescription>
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
             {/* Reset Button wrapped in AlertDialogTrigger */}
            <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isSending || messages.length <= 1} title={T.resetChatButton}>
                       <RotateCcw className="h-4 w-4 text-muted-foreground"/>
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{T.resetChatConfirmTitle}</AlertDialogTitle>
                        <AlertDialogDescription>{T.resetChatConfirmDesc}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleResetChatCancel}>{T.resetChatCancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetChatConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                             {T.resetChatConfirm}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

             {/* Attach Button */}
            <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isSending || limitReached}>
                 <Paperclip className="h-4 w-4" />
                 <span className="sr-only">{T.attachLabel}</span>
            </Button>
             <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/jpeg, image/png"
                className="hidden"
                disabled={limitReached} // Disable file input when limit reached
             />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={limitReached ? T.inputPlaceholderLimitReached : T.inputPlaceholder}
            className="flex-grow"
            onKeyDown={(e) => e.key === 'Enter' && !isSending && handleSend()}
            disabled={isSending || limitReached} // Disable input when limit reached
          />
          <Button onClick={handleSend} disabled={isSending || limitReached || (!input.trim() && !imageDataUri)} className="min-w-[80px]">
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">{isSending ? T.sendingButton : T.sendButton}</span>
          </Button>
        </DialogFooter>
      </DialogContent>

    </Dialog>
  );
}
