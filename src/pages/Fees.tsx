import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, DollarSign } from "lucide-react";
import Layout from "@/components/Layout";
import { ProtectedRoute } from "@/lib/auth";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  father_name: string;
  monthly_fee: number;
}

interface FeeRecord {
  student_id: string;
  date_paid: string;
}

const Fees = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [paidFees, setPaidFees] = useState<Map<string, string>>(new Map());
  const [currentMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch all students
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .order('name');

    if (studentsError) {
      toast.error("طلباء لوڈ کرنے میں خرابی");
      return;
    }

    setStudents(studentsData || []);

    // Fetch fees for current month
    const { data: feesData } = await supabase
      .from('fees')
      .select('student_id, date_paid')
      .eq('month', currentMonth);

    const feesMap = new Map<string, string>();
    feesData?.forEach((record: FeeRecord) => {
      feesMap.set(record.student_id, record.date_paid);
    });
    setPaidFees(feesMap);
  };

  const collectFee = async (studentId: string, amount: number) => {
    const { error } = await supabase
      .from('fees')
      .upsert({
        student_id: studentId,
        month: currentMonth,
        amount_paid: amount,
      }, {
        onConflict: 'student_id,month'
      });

    if (error) {
      toast.error("فیس محفوظ کرنے میں خرابی");
    } else {
      toast.success("فیس وصول ہو گئی");
      fetchData();
    }
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const months = [
      'جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون',
      'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'
    ];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    return date.toLocaleDateString('ur-PK', options);
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">فیس</h2>
            <p className="text-xl text-muted-foreground">{formatMonth(currentMonth)}</p>
          </div>

          <div className="space-y-4">
            {students.map((student) => {
              const isPaid = paidFees.has(student.id);
              const paidDate = paidFees.get(student.id);

              return (
                <Card key={student.id} className="shadow-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <h3 className="text-lg font-bold">{student.name}</h3>
                        <p className="text-sm text-muted-foreground">والد: {student.father_name}</p>
                        <p className="text-sm font-medium text-accent mt-1">
                          ماہانہ فیس: {student.monthly_fee} روپے
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {isPaid ? (
                          <div className="flex items-center gap-2 text-success">
                            <CheckCircle className="h-5 w-5" />
                            <div className="text-right">
                              <p className="font-medium">ادا شدہ</p>
                              <p className="text-xs">{paidDate && formatDate(paidDate)}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-destructive font-medium">واجب الادا</span>
                            <Button
                              onClick={() => collectFee(student.id, student.monthly_fee)}
                              className="gap-2"
                            >
                              <DollarSign className="h-4 w-4" />
                              فیس وصول کریں
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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

export default Fees;
