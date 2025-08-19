import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Calculator className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Financial Position Calculator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Quickly calculate your current financial position with cash counting, 
            weekly income and expense tracking, and automated balance calculations.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="mr-2 h-5 w-5 text-primary" />
                Cash Counter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Count Australian notes and coins with automatic subtotals and total calculation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Weekly Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Track income and expenses for current and next week with customizable categories.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Auto Calculations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Real-time calculations cascade from cash counter through to final weekly balances.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button 
            onClick={() => window.location.href = '/api/login'}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg"
          >
            Get Started - Sign In
          </Button>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Your data will be securely saved and synced across devices
          </p>
        </div>
      </div>
    </div>
  );
}
