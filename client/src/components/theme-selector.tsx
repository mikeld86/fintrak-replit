import { useTheme } from "@/contexts/simple-theme-context";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  // No dark mode functionality - app is permanently dark theme

  return (
    <div className="flex items-center space-x-2 sm:space-x-3">


      {/* Theme Color Buttons - Hidden on mobile */}
      <div className="hidden md:flex items-center space-x-2">
        <button
          onClick={() => setTheme("blue")}
          className={`w-6 h-6 rounded-full border-2 shadow-md transition-all ${
            theme === "blue" ? "border-white ring-2 ring-blue-300" : "border-gray-300"
          }`}
          style={{ backgroundColor: "#007AFF" }}
          aria-label="Blue theme"
        />
        <button
          onClick={() => setTheme("pink")}
          className={`w-6 h-6 rounded-full border-2 shadow-md transition-all ${
            theme === "pink" ? "border-white ring-2 ring-pink-300" : "border-gray-300"
          }`}
          style={{ backgroundColor: "#FF2D55" }}
          aria-label="Pink theme"
        />
        <button
          onClick={() => setTheme("green")}
          className={`w-6 h-6 rounded-full border-2 shadow-md transition-all ${
            theme === "green" ? "border-white ring-2 ring-green-300" : "border-gray-300"
          }`}
          style={{ backgroundColor: "#4CD964" }}
          aria-label="Green theme"
        />
        <button
          onClick={() => setTheme("orange")}
          className={`w-6 h-6 rounded-full border-2 shadow-md transition-all ${
            theme === "orange" ? "border-white ring-2 ring-orange-300" : "border-gray-300"
          }`}
          style={{ backgroundColor: "#FF9500" }}
          aria-label="Orange theme"
        />
        <button
          onClick={() => setTheme("red")}
          className={`w-6 h-6 rounded-full border-2 shadow-md transition-all ${
            theme === "red" ? "border-white ring-2 ring-red-300" : "border-gray-300"
          }`}
          style={{ backgroundColor: "#FF3B30" }}
          aria-label="Red theme"
        />
      </div>

      {/* Dark mode toggle removed - app is now permanently dark theme */}
    </div>
  );
}
