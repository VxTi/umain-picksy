import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function PicksyView() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-[420px] shadow-xl">
        <CardContent className="flex flex-col items-center gap-6 p-8">

          {/* Logo placeholder */}
          <div className="w-100 h-100 rounded-xl flex items-center justify-center text-sm text-muted-foreground">
            <img src="/picksy_logo_2.png" alt="logo" className="w-100 h-100 object-contain" />
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3 w-full">
            <Button size="lg" className="w-full">
              Select folder
            </Button>

            <Button size="lg" variant="outline" className="w-full">
              Call the developer directly
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}