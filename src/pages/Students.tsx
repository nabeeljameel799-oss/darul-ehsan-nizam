import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2 } from "lucide-react";
import Layout from "@/components/Layout";
import { ProtectedRoute } from "@/lib/auth";
import { toast } from "sonner";
import { z } from "zod";

const studentSchema = z.object({
  name: z.string().min(1, { message: "نام درج کریں" }),
  father_name: z.string().min(1, { message: "والد کا نام درج کریں" }),
  class_name: z.string().min(1, { message: "درجہ منتخب کریں" }),
  monthly_fee: z.number().min(0, { message: "فیس 0 یا اس سے زیادہ ہونی چاہیے" }),
});

interface Student {
  id: string;
  name: string;
  father_name: string;
  class_name: string;
  monthly_fee: number;
}

const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    father_name: "",
    class_name: "",
    monthly_fee: "",
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("طلباء لوڈ کرنے میں خرابی");
    } else {
      setStudents(data || []);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      father_name: "",
      class_name: "",
      monthly_fee: "",
    });
    setEditingStudent(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = studentSchema.parse({
        ...formData,
        monthly_fee: parseInt(formData.monthly_fee),
      });

      if (editingStudent) {
        const { error } = await supabase
          .from('students')
          .update({
            name: validatedData.name,
            father_name: validatedData.father_name,
            class_name: validatedData.class_name,
            monthly_fee: validatedData.monthly_fee,
          })
          .eq('id', editingStudent.id);

        if (error) throw error;
        toast.success("طالب علم کی معلومات تبدیل ہو گئیں");
      } else {
        const { error } = await supabase
          .from('students')
          .insert([{
            name: validatedData.name,
            father_name: validatedData.father_name,
            class_name: validatedData.class_name,
            monthly_fee: validatedData.monthly_fee,
          }]);

        if (error) throw error;
        toast.success("نیا طالب علم شامل ہو گیا");
      }

      fetchStudents();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("خرابی پیش آئی");
      }
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      father_name: student.father_name,
      class_name: student.class_name,
      monthly_fee: student.monthly_fee.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("کیا آپ واقعی اس طالب علم کو حذف کرنا چاہتے ہیں؟")) return;

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("حذف کرنے میں خرابی");
    } else {
      toast.success("طالب علم حذف ہو گیا");
      fetchStudents();
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">طلباء</h2>
              <p className="text-muted-foreground">تمام طلباء کی فہرست</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  نیا طالب علم شامل کریں
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingStudent ? "طالب علم کی معلومات تبدیل کریں" : "نیا طالب علم شامل کریں"}
                  </DialogTitle>
                  <DialogDescription>
                    تمام معلومات درج کریں
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">نام</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="father_name">والد کا نام</Label>
                    <Input
                      id="father_name"
                      value={formData.father_name}
                      onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class_name">درجہ</Label>
                    <Select
                      value={formData.class_name}
                      onValueChange={(value) => setFormData({ ...formData, class_name: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="درجہ منتخب کریں" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="قاعدہ">قاعدہ</SelectItem>
                        <SelectItem value="ناظرہ">ناظرہ</SelectItem>
                        <SelectItem value="حفظ">حفظ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthly_fee">ماہانہ فیس</Label>
                    <Input
                      id="monthly_fee"
                      type="number"
                      value={formData.monthly_fee}
                      onChange={(e) => setFormData({ ...formData, monthly_fee: e.target.value })}
                      required
                      dir="ltr"
                      className="text-left"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {editingStudent ? "تبدیلیاں محفوظ کریں" : "شامل کریں"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {students.map((student) => (
              <Card key={student.id} className="shadow-card hover:shadow-soft transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 flex-1">
                      <h3 className="text-xl font-bold">{student.name}</h3>
                      <p className="text-muted-foreground">والد: {student.father_name}</p>
                      <div className="flex gap-4 text-sm">
                        <span className="text-primary font-medium">درجہ: {student.class_name}</span>
                        <span className="text-accent font-medium">فیس: {student.monthly_fee} روپے</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(student)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(student.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {students.length === 0 && (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">ابھی کوئی طالب علم شامل نہیں ہے</p>
              </Card>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default Students;
