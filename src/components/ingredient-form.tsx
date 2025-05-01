
// IngredientForm component
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from "@/components/ui/switch";
import { Loader2, ChefHat, Utensils, AlertCircle, Mic, MicOff, Info } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useSpeechRecognition, useSpeechSynthesis } from '@/hooks/use-speech-recognition';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// UI Text translations
const uiText = {
    "en": {
        enterIngredientsTitle: "Enter Ingredients",
        ingredientsLabel: "List ingredients separated by commas (e.g., chicken, rice, broccoli).",
        voiceChatPlaceholderListening: "Listening...",
        voiceChatPlaceholderActive: "Voice chat active. Tap mic to speak.",
        voiceChatPlaceholderInactive: "Type your ingredients...",
        voiceChatErrorTitle: "Voice Error",
        voiceChatToggleLabel: "Interactive Voice Chat",
        voiceChatSupportWarning: "Voice chat requires browser support for Speech Recognition and Synthesis.",
        voiceChatNotSupported: "(Not Supported)",
        voiceChatInfoListening: "Actively listening for ingredients...",
        voiceChatInfoReady: "Voice chat is on. Tap the mic icon to speak.",
        generateButtonLabel: "Generate Recipe",
        generatingButtonLabel: "Generating...",
        inputErrorEmpty: "Please list at least one ingredient.",
        inputErrorTooShort: "Ingredient name seems too short. Please enter valid ingredients.",
        inputErrorInvalid: "No valid ingredients found. Please list ingredients separated by commas.",
        toastFormatWarningTitle: "Check Format",
        toastFormatWarningDescription: "Remember to separate multiple ingredients with commas for best results.",
        voiceChatNotSupportedTitle: "Voice Chat Not Supported",
        voiceChatNotSupportedDesc: "Your browser does not fully support the required Speech Recognition or Synthesis APIs.",
        voiceChatEnabledSpeak: "Voice chat enabled. Please state your ingredients clearly, separated by pauses.",
        voiceChatDisabledSpeak: "Voice chat disabled.",
        ariaLabelIngredients: "Enter available ingredients separated by commas",
        ariaLabelStopListening: "Stop listening",
        ariaLabelStartListening: "Start listening",
        ariaLabelVoiceChatToggle: "Toggle Interactive Voice Chat",
    },
    "es": {
        enterIngredientsTitle: "Ingresar Ingredientes",
        ingredientsLabel: "Enumera los ingredientes separados por comas (ej., pollo, arroz, brócoli).",
        voiceChatPlaceholderListening: "Escuchando...",
        voiceChatPlaceholderActive: "Chat de voz activo. Toca el micrófono para hablar.",
        voiceChatPlaceholderInactive: "Escribe tus ingredientes...",
        voiceChatErrorTitle: "Error de Voz",
        voiceChatToggleLabel: "Chat de Voz Interactivo",
        voiceChatSupportWarning: "El chat de voz requiere soporte del navegador para Reconocimiento y Síntesis de Voz.",
        voiceChatNotSupported: "(No Soportado)",
        voiceChatInfoListening: "Escuchando activamente los ingredientes...",
        voiceChatInfoReady: "El chat de voz está activado. Toca el icono del micrófono para hablar.",
        generateButtonLabel: "Generar Receta",
        generatingButtonLabel: "Generando...",
        inputErrorEmpty: "Por favor, enumera al menos un ingrediente.",
        inputErrorTooShort: "El nombre del ingrediente parece demasiado corto. Introduce ingredientes válidos.",
        inputErrorInvalid: "No se encontraron ingredientes válidos. Enumera los ingredientes separados por comas.",
        toastFormatWarningTitle: "Verificar Formato",
        toastFormatWarningDescription: "Recuerda separar múltiples ingredientes con comas para mejores resultados.",
        voiceChatNotSupportedTitle: "Chat de Voz No Soportado",
        voiceChatNotSupportedDesc: "Tu navegador no es totalmente compatible con las API de Reconocimiento o Síntesis de Voz requeridas.",
        voiceChatEnabledSpeak: "Chat de voz activado. Indica tus ingredientes claramente, separados por pausas.",
        voiceChatDisabledSpeak: "Chat de voz desactivado.",
        ariaLabelIngredients: "Introduce los ingredientes disponibles separados por comas",
        ariaLabelStopListening: "Dejar de escuchar",
        ariaLabelStartListening: "Empezar a escuchar",
        ariaLabelVoiceChatToggle: "Activar/Desactivar Chat de Voz Interactivo",
    },
    "fr": {
        enterIngredientsTitle: "Entrer les Ingrédients",
        ingredientsLabel: "Listez les ingrédients séparés par des virgules (ex: poulet, riz, brocoli).",
        voiceChatPlaceholderListening: "Écoute...",
        voiceChatPlaceholderActive: "Chat vocal actif. Appuyez sur le micro pour parler.",
        voiceChatPlaceholderInactive: "Tapez vos ingrédients...",
        voiceChatErrorTitle: "Erreur Vocale",
        voiceChatToggleLabel: "Chat Vocal Interactif",
        voiceChatSupportWarning: "Le chat vocal nécessite la prise en charge par le navigateur de la reconnaissance et de la synthèse vocales.",
        voiceChatNotSupported: "(Non Supporté)",
        voiceChatInfoListening: "Écoute active des ingrédients...",
        voiceChatInfoReady: "Le chat vocal est activé. Appuyez sur l'icône du micro pour parler.",
        generateButtonLabel: "Générer la Recette",
        generatingButtonLabel: "Génération...",
        inputErrorEmpty: "Veuillez lister au moins un ingrédient.",
        inputErrorTooShort: "Le nom de l'ingrédient semble trop court. Veuillez entrer des ingrédients valides.",
        inputErrorInvalid: "Aucun ingrédient valide trouvé. Veuillez lister les ingrédients séparés par des virgules.",
        toastFormatWarningTitle: "Vérifier le Format",
        toastFormatWarningDescription: "N'oubliez pas de séparer plusieurs ingrédients par des virgules pour de meilleurs résultats.",
        voiceChatNotSupportedTitle: "Chat Vocal Non Supporté",
        voiceChatNotSupportedDesc: "Votre navigateur ne prend pas entièrement en charge les API de reconnaissance ou de synthèse vocales requises.",
        voiceChatEnabledSpeak: "Chat vocal activé. Énoncez clairement vos ingrédients, séparés par des pauses.",
        voiceChatDisabledSpeak: "Chat vocal désactivé.",
        ariaLabelIngredients: "Entrez les ingrédients disponibles séparés par des virgules",
        ariaLabelStopListening: "Arrêter l'écoute",
        ariaLabelStartListening: "Commencer l'écoute",
        ariaLabelVoiceChatToggle: "Activer/Désactiver le Chat Vocal Interactif",
    },
    "de": {
        enterIngredientsTitle: "Zutaten eingeben",
        ingredientsLabel: "Zutaten durch Kommas getrennt auflisten (z.B. Hähnchen, Reis, Brokkoli).",
        voiceChatPlaceholderListening: "Höre zu...",
        voiceChatPlaceholderActive: "Voice-Chat aktiv. Tippen Sie zum Sprechen auf das Mikrofon.",
        voiceChatPlaceholderInactive: "Geben Sie Ihre Zutaten ein...",
        voiceChatErrorTitle: "Sprachfehler",
        voiceChatToggleLabel: "Interaktiver Voice-Chat",
        voiceChatSupportWarning: "Voice-Chat erfordert Browserunterstützung für Spracherkennung und -synthese.",
        voiceChatNotSupported: "(Nicht unterstützt)",
        voiceChatInfoListening: "Höre aktiv auf Zutaten...",
        voiceChatInfoReady: "Voice-Chat ist aktiviert. Tippen Sie zum Sprechen auf das Mikrofonsymbol.",
        generateButtonLabel: "Rezept generieren",
        generatingButtonLabel: "Generiere...",
        inputErrorEmpty: "Bitte listen Sie mindestens eine Zutat auf.",
        inputErrorTooShort: "Zutatenname scheint zu kurz. Bitte geben Sie gültige Zutaten ein.",
        inputErrorInvalid: "Keine gültigen Zutaten gefunden. Bitte listen Sie Zutaten durch Kommas getrennt auf.",
        toastFormatWarningTitle: "Format prüfen",
        toastFormatWarningDescription: "Denken Sie daran, mehrere Zutaten für beste Ergebnisse mit Kommas zu trennen.",
        voiceChatNotSupportedTitle: "Voice-Chat nicht unterstützt",
        voiceChatNotSupportedDesc: "Ihr Browser unterstützt die erforderlichen Spracherkennungs- oder Synthese-APIs nicht vollständig.",
        voiceChatEnabledSpeak: "Voice-Chat aktiviert. Nennen Sie Ihre Zutaten deutlich, getrennt durch Pausen.",
        voiceChatDisabledSpeak: "Voice-Chat deaktiviert.",
        ariaLabelIngredients: "Verfügbare Zutaten durch Kommas getrennt eingeben",
        ariaLabelStopListening: "Zuhören beenden",
        ariaLabelStartListening: "Zuhören beginnen",
        ariaLabelVoiceChatToggle: "Interaktiven Voice-Chat umschalten",
    },
    "hi": { // Hindi Translations
        enterIngredientsTitle: "सामग्री दर्ज करें",
        ingredientsLabel: "सामग्री को अल्पविराम से अलग करके सूचीबद्ध करें (उदा., चिकन, चावल, ब्रोकोली)।",
        voiceChatPlaceholderListening: "सुन रहा हूँ...",
        voiceChatPlaceholderActive: "वॉइस चैट सक्रिय। बोलने के लिए माइक पर टैप करें।",
        voiceChatPlaceholderInactive: "अपनी सामग्री टाइप करें...",
        voiceChatErrorTitle: "वॉइस त्रुटि",
        voiceChatToggleLabel: "इंटरैक्टिव वॉइस चैट",
        voiceChatSupportWarning: "वॉइस चैट के लिए स्पीच रिकग्निशन और सिंथेसिस के लिए ब्राउज़र समर्थन आवश्यक है।",
        voiceChatNotSupported: "(समर्थित नहीं)",
        voiceChatInfoListening: "सामग्री के लिए सक्रिय रूप से सुन रहा हूँ...",
        voiceChatInfoReady: "वॉइस चैट चालू है। बोलने के लिए माइक आइकन पर टैप करें।",
        generateButtonLabel: "रेसिपी बनाएं",
        generatingButtonLabel: "बनाया जा रहा है...",
        inputErrorEmpty: "कृपया कम से कम एक सामग्री सूचीबद्ध करें।",
        inputErrorTooShort: "सामग्री का नाम बहुत छोटा लगता है। कृपया मान्य सामग्री दर्ज करें।",
        inputErrorInvalid: "कोई मान्य सामग्री नहीं मिली। कृपया अल्पविराम से अलग करके सामग्री सूचीबद्ध करें।",
        toastFormatWarningTitle: "प्रारूप जांचें",
        toastFormatWarningDescription: "सर्वोत्तम परिणामों के लिए एकाधिक सामग्रियों को अल्पविराम से अलग करना याद रखें।",
        voiceChatNotSupportedTitle: "वॉइस चैट समर्थित नहीं",
        voiceChatNotSupportedDesc: "आपका ब्राउज़र आवश्यक स्पीच रिकग्निशन या सिंथेसिस एपीआई का पूरी तरह से समर्थन नहीं करता है।",
        voiceChatEnabledSpeak: "वॉइस चैट सक्षम। कृपया अपनी सामग्री स्पष्ट रूप से बताएं, विरामों से अलग करें।",
        voiceChatDisabledSpeak: "वॉइस चैट अक्षम।",
        ariaLabelIngredients: "उपलब्ध सामग्री अल्पविराम से अलग करके दर्ज करें",
        ariaLabelStopListening: "सुनना बंद करें",
        ariaLabelStartListening: "सुनना शुरू करें",
        ariaLabelVoiceChatToggle: "इंटरैक्टिव वॉइस चैट टॉगल करें",
    },
    "bn": { // Bengali Translations
        enterIngredientsTitle: "উপকরণ লিখুন",
        ingredientsLabel: "উপকরণগুলি কমা দ্বারা পৃথক করে তালিকাভুক্ত করুন (যেমন, চিকেন, ভাত, ব্রোকলি)।",
        voiceChatPlaceholderListening: "শুনছি...",
        voiceChatPlaceholderActive: "ভয়েস চ্যাট সক্রিয়। কথা বলতে মাইকে ট্যাপ করুন।",
        voiceChatPlaceholderInactive: "আপনার উপকরণ টাইপ করুন...",
        voiceChatErrorTitle: "ভয়েস ত্রুটি",
        voiceChatToggleLabel: "ইন্টারেক্টিভ ভয়েস চ্যাট",
        voiceChatSupportWarning: "ভয়েস চ্যাটের জন্য স্পিচ রিকগনিশন এবং সিন্থেসিসের জন্য ব্রাউজার সমর্থন প্রয়োজন।",
        voiceChatNotSupported: "(সমর্থিত নয়)",
        voiceChatInfoListening: "সক্রিয়ভাবে উপকরণের জন্য শুনছি...",
        voiceChatInfoReady: "ভয়েস চ্যাট চালু আছে। কথা বলতে মাইক আইকনে ট্যাপ করুন।",
        generateButtonLabel: "রেসিপি তৈরি করুন",
        generatingButtonLabel: "তৈরি হচ্ছে...",
        inputErrorEmpty: "অনুগ্রহ করে অন্তত একটি উপকরণ তালিকাভুক্ত করুন।",
        inputErrorTooShort: "উপকরণের নাম খুব ছোট মনে হচ্ছে। অনুগ্রহ করে বৈধ উপকরণ লিখুন।",
        inputErrorInvalid: "কোনো বৈধ উপকরণ পাওয়া যায়নি। অনুগ্রহ করে কমা দ্বারা পৃথক করে উপকরণ তালিকাভুক্ত করুন।",
        toastFormatWarningTitle: "ফর্ম্যাট পরীক্ষা করুন",
        toastFormatWarningDescription: "সেরা ফলাফলের জন্য একাধিক উপকরণ কমা দিয়ে আলাদা করতে মনে রাখবেন।",
        voiceChatNotSupportedTitle: "ভয়েস চ্যাট সমর্থিত নয়",
        voiceChatNotSupportedDesc: "আপনার ব্রাউজার প্রয়োজনীয় স্পিচ রিকগনিশন বা সিন্থেসিস এপিআই সম্পূর্ণরূপে সমর্থন করে না।",
        voiceChatEnabledSpeak: "ভয়েস চ্যাট সক্ষম। অনুগ্রহ করে আপনার উপকরণগুলি স্পষ্টভাবে বলুন, বিরতি দিয়ে আলাদা করুন।",
        voiceChatDisabledSpeak: "ভয়েস চ্যাট অক্ষম।",
        ariaLabelIngredients: "উপলব্ধ উপকরণ কমা দ্বারা পৃথক করে লিখুন",
        ariaLabelStopListening: "শোনা বন্ধ করুন",
        ariaLabelStartListening: "শোনা শুরু করুন",
        ariaLabelVoiceChatToggle: "ইন্টারেক্টিভ ভয়েস চ্যাট টগল করুন",
    },
     // Add more languages as needed
};

// Language code mapping for SpeechRecognition
const speechRecognitionLangMap: { [key: string]: string } = {
    "en": "en-US",
    "es": "es-ES", // Or es-MX, es-US etc. depending on target dialect
    "fr": "fr-FR",
    "de": "de-DE",
    "hi": "hi-IN", // Added Hindi India
    "bn": "bn-BD", // Added Bengali Bangladesh (or bn-IN for India)
    // Add more mappings as needed
};


interface IngredientFormProps {
  onSubmit: (ingredientsString: string, preferredType?: string) => void;
  isGenerating: boolean;
  language: string; // Receive language code (e.g., 'en', 'es', 'hi', 'bn')
}

export function IngredientForm({ onSubmit, isGenerating, language }: IngredientFormProps) {
  const { toast } = useToast();
  const [ingredientsInput, setIngredientsInput] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [isVoiceChatEnabled, setIsVoiceChatEnabled] = useState(false);

  // Get translated UI text
  const T = uiText[language as keyof typeof uiText] || uiText['en'];
  const speechLang = speechRecognitionLangMap[language] || 'en-US';

  // --- Speech Recognition Hook ---
  const {
    isListening,
    transcript,
    error: speechError,
    isSupported: speechRecognitionSupported,
    startListening,
    stopListening,
    resetTranscript,
    setLanguage: setSpeechRecognitionLanguage, // Add function to set language
  } = useSpeechRecognition();

  // --- Speech Synthesis Hook ---
   const { speak, isSupported: speechSynthesisSupported, setLanguage: setSpeechSynthesisLanguage } = useSpeechSynthesis(); // Add function to set language
   const voiceSupport = useMemo(() => speechRecognitionSupported && speechSynthesisSupported, [speechRecognitionSupported, speechSynthesisSupported]);


  // Update speech recognition and synthesis language when prop changes
  useEffect(() => {
      setSpeechRecognitionLanguage(speechLang);
      setSpeechSynthesisLanguage(speechLang); // Use the same lang code for consistency
  }, [speechLang, setSpeechRecognitionLanguage, setSpeechSynthesisLanguage]);


  useEffect(() => {
    if (isVoiceChatEnabled && isListening) {
        // Logic to append transcript smartly
        setIngredientsInput((prevInput) => {
            const cleanedPrev = prevInput.trim().replace(/,$/, '').trim();
            const cleanedTranscript = transcript.trim();

            if (!cleanedTranscript) return prevInput; // Nothing new spoken

            // Avoid exact duplicates or partial overlaps at the end
            if (cleanedTranscript === cleanedPrev || cleanedPrev.endsWith(cleanedTranscript)) {
                 return prevInput;
            }

            // Handle joining new transcript part
            if (cleanedPrev && cleanedTranscript) {
                 // Check if the last word of previous and first word of new transcript might be the same (common ASR issue)
                 const lastWordPrev = cleanedPrev.split(/[\s,]+/).pop()?.toLowerCase() || '';
                 const firstWordTranscript = cleanedTranscript.split(/[\s,]+/)[0]?.toLowerCase() || '';

                // If words are different, just append with a comma
                if (lastWordPrev !== firstWordTranscript) {
                    return `${cleanedPrev}, ${cleanedTranscript}`;
                } else {
                    // If they seem the same, try replacing the last word of previous with the full new transcript
                    const wordsPrev = cleanedPrev.split(/[\s,]+/);
                    wordsPrev.pop(); // Remove the potentially duplicated last word
                    return `${wordsPrev.join(', ')}, ${cleanedTranscript}`;
                }
            } else {
                 // If previous input was empty, just set the new transcript
                 return cleanedTranscript;
            }
        });
    }
    // Transcript is the only direct dependency here, others are handled in start/stop/toggle
  }, [transcript, isListening, isVoiceChatEnabled]);


   const handleVoiceChatToggle = (checked: boolean) => {
    setIsVoiceChatEnabled(checked);
    if (!voiceSupport && checked) {
      toast({
        variant: "destructive",
        title: T.voiceChatNotSupportedTitle,
        description: T.voiceChatNotSupportedDesc,
      });
      setIsVoiceChatEnabled(false);
      return;
    }

    if (checked) {
      speak(T.voiceChatEnabledSpeak);
      setIngredientsInput('');
      resetTranscript();
      startListening();
    } else {
      if (isListening) {
        stopListening();
      }
      speak(T.voiceChatDisabledSpeak);
    }
  };

  const handleGenerateClick = () => {
    setInputError(null);
    const trimmedInput = ingredientsInput.trim();

    if (trimmedInput.length === 0) {
      setInputError(T.inputErrorEmpty);
      return;
    }
    // Basic validation: check if the input is very short and doesn't contain a comma
    if (trimmedInput.length < 3 && !trimmedInput.includes(',')) {
       setInputError(T.inputErrorTooShort);
       return;
    }


    // Show toast warning if spaces are used without commas (potential user error)
    if (trimmedInput.includes(' ') && !trimmedInput.includes(',')) {
       toast({
            variant: "default", // Use default variant for non-critical warning
            title: T.toastFormatWarningTitle,
            description: T.toastFormatWarningDescription,
            duration: 5000, // Show for 5 seconds
       });
    }

    // Clean up input: split by comma, trim spaces, filter out empty strings
    const nonEmptyIngredients = trimmedInput
                                .split(',')
                                .map(s => s.trim())
                                .filter(Boolean); // Filter out empty strings resulting from multiple commas etc.

    // Final validation: ensure there's at least one valid ingredient after cleaning
    if (nonEmptyIngredients.length === 0) {
        setInputError(T.inputErrorInvalid);
        return;
    }

    if (isVoiceChatEnabled && isListening) {
      stopListening();
    }

    // Call onSubmit without preferredType for initial generation
    onSubmit(nonEmptyIngredients.join(', ')); // Submit the cleaned, comma-separated string
  };

   const toggleManualListen = () => {
       if (!isVoiceChatEnabled || !voiceSupport) return;
       if (isListening) {
           stopListening();
       } else {
           resetTranscript();
           startListening(); // Will use the currently set language
       }
   };

  // Determine placeholder based on voice chat state
  const getPlaceholder = () => {
    if (isVoiceChatEnabled) {
        return isListening ? T.voiceChatPlaceholderListening : T.voiceChatPlaceholderActive;
    }
    return T.voiceChatPlaceholderInactive;
  };

  return (
    <div className="space-y-4">
      {/* This Card wrapper is removed as the content is now directly inside the parent CardContent */}
      <div className="space-y-3">
          <Label htmlFor="ingredients-input" className="text-sm text-muted-foreground">
            {T.ingredientsLabel}
          </Label>
          <div className="relative">
            <Textarea
              id="ingredients-input"
              placeholder={getPlaceholder()}
              className={`resize-none min-h-[100px] bg-background focus:ring-primary ${inputError ? 'border-destructive focus:ring-destructive' : ''} ${isVoiceChatEnabled ? 'pr-12' : ''}`} // Increased min-height
              value={ingredientsInput}
              onChange={(e) => {
                if (!isVoiceChatEnabled) {
                  setIngredientsInput(e.target.value);
                  setInputError(null);
                }
              }}
              aria-label={T.ariaLabelIngredients}
              aria-invalid={!!inputError}
              aria-describedby="input-error-msg"
              readOnly={isVoiceChatEnabled}
            />
            {isVoiceChatEnabled && voiceSupport && (
              <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 ${isListening ? 'text-destructive animate-pulse' : 'text-primary'} hover:bg-accent/50 rounded-full`} // Adjusted size and styling
                  onClick={toggleManualListen}
                  aria-label={isListening ? T.ariaLabelStopListening : T.ariaLabelStartListening}
                  disabled={isGenerating}
                >
                  {isListening ? <MicOff className="h-5 w-5"/> : <Mic className="h-5 w-5"/>}
                </Button>
             )}
          </div>
           {inputError && (
                <p id="input-error-msg" className="text-sm font-medium text-destructive flex items-center mt-1">
                    <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                    {inputError}
                </p>
            )}
            {isVoiceChatEnabled && speechError && (
                <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{T.voiceChatErrorTitle}</AlertTitle>
                    <AlertDescription>{speechError}</AlertDescription>
                </Alert>
             )}

            <div className="flex items-center space-x-2 pt-3">
                <Switch
                    id="voice-chat-switch"
                    checked={isVoiceChatEnabled}
                    onCheckedChange={handleVoiceChatToggle}
                    disabled={isGenerating || !voiceSupport}
                    aria-label={T.ariaLabelVoiceChatToggle}
                />
                <Label htmlFor="voice-chat-switch" className={`text-sm font-medium cursor-pointer ${!voiceSupport ? 'text-muted-foreground italic cursor-not-allowed' : 'text-muted-foreground'}`}>
                    {T.voiceChatToggleLabel} {!voiceSupport && T.voiceChatNotSupported}
                </Label>
            </div>
             {isVoiceChatEnabled && voiceSupport && (
                 <div className="text-xs text-muted-foreground italic p-2 border border-dashed border-accent/70 rounded-md bg-accent/10 dark:bg-accent/20 flex items-center mt-2">
                    <Info className="h-3 w-3 mr-1.5 flex-shrink-0 text-accent"/>
                    {isListening ? T.voiceChatInfoListening : T.voiceChatInfoReady}
                 </div>
             )}
             {isVoiceChatEnabled && !voiceSupport && (
                  <div className="text-xs text-destructive italic p-2 border border-dashed border-destructive/50 rounded-md bg-destructive/10 dark:bg-destructive/20 flex items-center mt-2">
                     <AlertCircle className="h-3 w-3 mr-1.5 flex-shrink-0"/>
                     {T.voiceChatSupportWarning}
                  </div>
             )}
        </div>

        <div className="pt-4"> {/* Added padding top for separation */}
           <Button
             type="button"
             onClick={handleGenerateClick}
             className="w-full bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary text-base h-11 shadow-md" // Increased size and added shadow
             disabled={isGenerating || (isVoiceChatEnabled && isListening)}
             aria-live="polite"
           >
             {isGenerating ? (
               <>
                 <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {/* Increased icon size */}
                 {T.generatingButtonLabel}
               </>
             ) : (
               <>
                 <ChefHat className="mr-2 h-5 w-5" /> {/* Increased icon size */}
                 {T.generateButtonLabel}
               </>
             )}
           </Button>
        </div>
    </div>
  );
}
