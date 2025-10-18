import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ArrowRight, CheckCircle, XCircle, Coffee } from "lucide-react";
import Layout from "@/components/Layout";
import { ProtectedRoute } from "@/lib/auth";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  father_name: string;
  class_name: string;
  monthly_fee: number;
}

interface AttendanceRecord {
  date: string;
  status: string;
}

const StudentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDates, setSelectedDates] = useState<{
    present: Date[];
    absent: Date[];
    leave: Date[];
  }>({ present: [], absent: [], leave: [] });

  useEffect(() => {
    if (id) {
      fetchStudentDetails();
      fetchAttendanceHistory();
    }
  }, [id]);

  const fetchStudentDetails = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast.error("طالب علم کی معلومات لوڈ کرنے میں خرابی");
      navigate('/students');
    } else {
      setStudent(data);
    }
  };

  const fetchAttendanceHistory = async () => {
    const { data, error } = await supabase
      .from('attendance')
      .select('date, status')
      .eq('student_id', id)
      .order('date', { ascending: false });

    if (error) {
      toast.error("حاضری کی تفصیلات لوڈ کرنے میں خرابی");
    } else {
      setAttendanceRecords(data || []);
      
      // Organize dates by status
      const present: Date[] = [];
      const absent: Date[] = [];
      const leave: Date[] = [];

      data?.forEach((record) => {
        const date = new Date(record.date);
        if (record.status === 'present') present.push(date);
        else if (record.status === 'absent') absent.push(date);
        else if (record.status === 'leave') leave.push(date);
      });

      setSelectedDates({ present, absent, leave });
    }
  };

  const modifiers = {
    present: selectedDates.present,
    absent: selectedDates.absent,
    leave: selectedDates.leave,
  };

  const modifiersStyles = {
    present: {
      backgroundColor: 'hsl(var(--success))',
      color: 'white',
      fontWeight: 'bold',
    },
    absent: {
      backgroundColor: 'hsl(var(--destructive))',
      color: 'white',
      fontWeight: 'bold',
    },
    leave: {
      backgroundColor: 'hsl(var(--accent))',
      color: 'white',
      fontWeight: 'bold',
    },
  };

  if (!student) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="text-center py-12">
            <p className="text-muted-foreground">لوڈ ہو رہا ہے...</p>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/students')}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-3xl font-bold">{student.name}</h2>
              <p className="text-muted-foreground">طالب علم کی تفصیلات</p>
            </div>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>بنیادی معلومات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">نام</p>
                  <p className="text-lg font-bold">{student.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">والد کا نام</p>
                  <p className="text-lg font-bold">{student.father_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">درجہ</p>
                  <p className="text-lg font-bold text-primary">{student.class_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ماہانہ فیس</p>
                  <p className="text-lg font-bold text-accent">{student.monthly_fee} روپے</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>حاضری کا مکمل ریکارڈ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-6 flex-wrap justify-center">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="text-sm">حاضر ({selectedDates.present.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <span className="text-sm">غیر حاضر ({selectedDates.absent.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Coffee className="h-5 w-5 text-accent" />
                  <span className="text-sm">رخصت ({selectedDates.leave.length})</span>
                </div>
              </div>

              <div className="flex justify-center">
                <Calendar
                  mode="multiple"
                  modifiers={modifiers}
                  modifiersStyles={modifiersStyles}
                  className="rounded-md border pointer-events-auto"
                  disabled={(date) => date > new Date()}
                />
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                <h3 className="font-bold text-lg">حالیہ ریکارڈ</h3>
                {attendanceRecords.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">ابھی کوئی حاضری کا ریکارڈ نہیں ہے</p>
                ) : (
                  attendanceRecords.map((record, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {new Date(record.date).toLocaleDateString('ur-PK', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                        <div className="flex items-center gap-2">
                          {record.status === 'present' && (
                            <>
                              <CheckCircle className="h-4 w-4 text-success" />
                              <span className="text-success font-medium">حاضر</span>
                            </>
                          )}
                          {record.status === 'absent' && (
                            <>
                              <XCircle className="h-4 w-4 text-destructive" />
                              <span className="text-destructive font-medium">غیر حاضر</span>
                            </>
                          )}
                          {record.status === 'leave' && (
                            <>
                              <Coffee className="h-4 w-4 text-accent" />
                              <span className="text-accent font-medium">رخصت</span>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default StudentDetail;
