import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email({ message: "براہ کرم درست ای میل درج کریں" }),
  password: z.string().min(6, { message: "پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے" }),
});

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      authSchema.parse({ email, password });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setLoading(true);
    
    const { error } = isSignUp 
      ? await signUp(email, password)
      : await signIn(email, password);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("ای میل یا پاس ورڈ غلط ہے");
      } else if (error.message.includes("User already registered")) {
        toast.error("یہ ای میل پہلے سے موجود ہے");
      } else {
        toast.error("خرابی: " + error.message);
      }
    } else {
      if (isSignUp) {
        toast.success("اکاؤنٹ کامیابی سے بنایا گیا! اب لاگ ان کریں۔");
        setIsSignUp(false);
      } else {
        toast.success("خوش آمدید!");
        navigate("/");
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold">مدرسہ دارالاحسان</CardTitle>
          <CardDescription className="text-lg">
            {isSignUp ? "نیا اکاؤنٹ بنائیں" : "منتظم داخلہ"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">ای میل</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                disabled={loading}
                dir="ltr"
                className="text-left"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">پاس ورڈ</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                required
                disabled={loading}
                dir="ltr"
                className="text-left"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "براہ کرم انتظار کریں..." : (isSignUp ? "اکاؤنٹ بنائیں" : "داخل ہوں")}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-primary hover:underline"
                disabled={loading}
              >
                {isSignUp ? "پہلے سے اکاؤنٹ ہے؟ لاگ ان کریں" : "نیا اکاؤنٹ بنائیں"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
