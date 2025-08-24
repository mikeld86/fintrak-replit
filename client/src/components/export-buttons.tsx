import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { exportToExcel, exportToPDF, ExportData } from "@/lib/exportUtils";

interface ExportButtonsProps {
  data: ExportData;
}

export function ExportButtons({ data }: ExportButtonsProps) {
  const handleExcelExport = () => {
    try {
      exportToExcel(data);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error exporting to Excel. Please try again.');
    }
  };

  const handlePDFExport = () => {
    try {
      exportToPDF(data);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Error exporting to PDF. Please try again.');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-gray-600 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200 touch-manipulation"
        >
          <Download className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background border border-border shadow-lg">
        <DropdownMenuItem onClick={handleExcelExport} className="text-foreground hover:bg-accent hover:text-accent-foreground">
          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
          Export to Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePDFExport} className="text-foreground hover:bg-accent hover:text-accent-foreground">
          <FileText className="h-4 w-4 mr-2 text-red-600" />
          Export to PDF (.pdf)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}