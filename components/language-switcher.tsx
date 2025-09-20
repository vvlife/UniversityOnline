"use client"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"

interface LanguageSwitcherProps {
  currentLang: string
  onLanguageChange: (lang: string) => void
}

export default function LanguageSwitcher({ currentLang, onLanguageChange }: LanguageSwitcherProps) {
  const languages = [
    { code: "zh", name: "中文", flag: "🇨🇳" },
    { code: "en", name: "English", flag: "🇺🇸" },
  ]

  const currentLanguage = languages.find((lang) => lang.code === currentLang) || languages[0]

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="bg-white/80 backdrop-blur-sm hover:bg-white flex items-center gap-2"
        onClick={() => {
          const nextLang = currentLang === "zh" ? "en" : "zh"
          onLanguageChange(nextLang)
        }}
      >
        <Globe className="h-4 w-4" />
        <span className="text-sm">{currentLanguage.flag}</span>
        <span className="hidden sm:inline text-sm">{currentLanguage.name}</span>
      </Button>
    </div>
  )
}
