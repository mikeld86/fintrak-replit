import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FONT_OPTIONS = [
  { name: "DM Sans", value: "DM Sans" },
  { name: "Barlow", value: "Barlow" },
  { name: "Manrope", value: "Manrope" },
  { name: "Titillium Web", value: "Titillium Web" },
  { name: "Outfit", value: "Outfit" },
  { name: "Saira", value: "Saira" },
  { name: "Share Tech", value: "Share Tech" },
  { name: "Space Grotesk", value: "Space Grotesk" },
  { name: "Sora", value: "Sora" },
  { name: "JetBrains Mono", value: "JetBrains Mono" },
  { name: "Gabarito", value: "Gabarito" },
  { name: "Gibson", value: "Gibson" },
];

export function FontTester() {
  const [selectedFont, setSelectedFont] = useState("DM Sans");
  const [appliedFont, setAppliedFont] = useState("DM Sans");

  // Load Google Fonts dynamically
  useEffect(() => {
    const loadGoogleFont = (fontName: string) => {
      const fontUrl = fontName.replace(/\s+/g, '+');
      const linkId = `google-font-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
      
      // Check if font is already loaded
      if (document.getElementById(linkId)) return;
      
      const link = document.createElement('link');
      link.id = linkId;
      link.href = `https://fonts.googleapis.com/css2?family=${fontUrl}:wght@300;400;500;600;700&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    };

    // Load all fonts
    FONT_OPTIONS.forEach(font => loadGoogleFont(font.value));
  }, []);

  const applyFont = () => {
    // Apply font to entire document body
    document.body.style.fontFamily = `"${selectedFont}", sans-serif`;
    setAppliedFont(selectedFont);
  };

  // Apply Space Grotesk by default on component mount
  useEffect(() => {
    document.body.style.fontFamily = '"Space Grotesk", sans-serif';
    setAppliedFont("Space Grotesk");
    setSelectedFont("Space Grotesk");
  }, []);

  const resetFont = () => {
    // Reset to default font
    document.body.style.fontFamily = '';
    setAppliedFont("DM Sans");
    setSelectedFont("DM Sans");
  };

  return (
    <div className="fixed top-20 right-4 z-[60] bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
      <h3 className="text-sm font-medium mb-3">Font Tester</h3>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
        Current: {appliedFont}
      </p>
      <Select value={selectedFont} onValueChange={setSelectedFont}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONT_OPTIONS.map((font) => (
            <SelectItem key={font.value} value={font.value}>
              {font.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button 
        className="mt-2 w-full" 
        onClick={applyFont}
      >
        Apply Font
      </Button>
      <Button 
        variant="outline" 
        className="mt-1 w-full" 
        onClick={resetFont}
      >
        Reset to Default
      </Button>
    </div>
  );
}