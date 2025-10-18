import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, XCircle, Coffee } from "lucide-react";
import Layout from "@/components/Layout";
import { ProtectedRoute } from "@/lib/auth";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  father_name: string;
  class_name: string;
}

interface AttendanceRecord {
  student_id: string;
  status: string;
}

const Attendance = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [attendance, setAttendance] = useState<Map<string, string>>(new Map());
  const [today] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass]);

  const fetchStudents = async () => {
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('class_name', selectedClass)
      .order('name');

    if (studentsError) {
      toast.error("طلباء لوڈ کرنے میں خرابی");
      return;
    }

    setStudents(studentsData || []);

    // Fetch today's attendance
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('student_id, status')
      .eq('date', today);

    const attendanceMap = new Map<string, string>();
    attendanceData?.forEach((record: AttendanceRecord) => {
      attendanceMap.set(record.student_id, record.status);
    });
    setAttendance(attendanceMap);
  };

  const markAttendance = async (studentId: string, status: string) => {
    const { error } = await supabase
      .from('attendance')
      .upsert({
        student_id: studentId,
        date: today,
        status: status,
      }, {
        onConflict: 'student_id,date'
      });

    if (error) {
      toast.error("حاضری محفوظ کرنے میں خرابی");
    } else {
      setAttendance(new Map(attendance.set(studentId, status)));
      toast.success("حاضری محفوظ ہو گئی");
    }
  };

  const getButtonVariant = (studentId: string, status: string) => {
    return attendance.get(studentId) === status ? "default" : "outline";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    };
    return date.toLocaleDateString('ur-PK', options);
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">حاضری</h2>
            <p className="text-xl text-muted-foreground mb-4">{formatDate(today)}</p>
          </div>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">درجہ منتخب کریں</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="درجہ منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="قاعدہ">قاعدہ</SelectItem>
                    <SelectItem value="ناظرہ">ناظرہ</SelectItem>
                    <SelectItem value="حفظ">حفظ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {selectedClass && (
            <div className="space-y-4">
              {students.map((student) => (
                <Card key={student.id} className="shadow-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <h3 className="text-lg font-bold">{student.name}</h3>
                        <p className="text-sm text-muted-foreground">والد: {student.father_name}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant={getButtonVariant(student.id, 'present')}
                          className="gap-2 bg-success hover:bg-success/90 text-success-foreground"
                          onClick={() => markAttendance(student.id, 'present')}
                        >
                          <CheckCircle className="h-4 w-4" />
                          حاضر
                        </Button>
                        <Button
                          variant={getButtonVariant(student.id, 'absent')}
                          className="gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          onClick={() => markAttendance(student.id, 'absent')}
                        >
                          <XCircle className="h-4 w-4" />
                          غیر حاضر
                        </Button>
                        <Button
                          variant={getButtonVariant(student.id, 'leave')}
                          className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
                          onClick={() => markAttendance(student.id, 'leave')}
                        >
                          <Coffee className="h-4 w-4" />
                          رخصت
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {students.length === 0 && (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">اس درجے میں کوئی طالب علم نہیں</p>
                </Card>
              )}
            </div>
          )}

          {!selectedClass && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">براہ کرم درجہ منتخب کریں</p>
            </Card>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default Attendance;
