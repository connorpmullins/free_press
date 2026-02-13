import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function SubscribeSuccessPage() {
  return (
    <div className="container max-w-md mx-auto px-4 py-20">
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Welcome aboard!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for supporting independent journalism. You now have full
            access to all articles on Free Press.
          </p>
          <Link href="/feed">
            <Button>Start Reading</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
