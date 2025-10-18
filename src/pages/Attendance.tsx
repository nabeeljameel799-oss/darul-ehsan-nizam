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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckCircle, XCircle, Coffee, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Layout from "@/components/Layout";
import { ProtectedRoute } from "@/lib/auth";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

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
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');
  
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass, selectedDate]);

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

    // Fetch attendance for selected date
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('student_id, status')
      .eq('date', dateStr);

    const attendanceMap = new Map<string, string>();
    attendanceData?.forEach((record: AttendanceRecord) => {
      attendanceMap.set(record.student_id, record.status);
    });
    setAttendance(attendanceMap);
  };

  const markAttendance = async (studentId: string, status: string) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const { error } = await supabase
      .from('attendance')
      .upsert({
        student_id: studentId,
        date: dateStr,
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

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">حاضری</h2>
          </div>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex gap-4 flex-wrap">
                <div className="space-y-2 flex-1 min-w-[240px]">
                  <label className="text-sm font-medium">تاریخ منتخب کریں</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, "PPP")
                        ) : (
                          <span>تاریخ منتخب کریں</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2 flex-1 min-w-[200px]">
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
              </div>
            </CardContent>
          </Card>

          {selectedClass && (
            <div className="space-y-4">
              {students
                .filter(student => {
                  if (!filterParam) return true;
                  const status = attendance.get(student.id);
                  return status === filterParam;
                })
                .map((student) => (
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
              {students.filter(student => {
                if (!filterParam) return true;
                const status = attendance.get(student.id);
                return status === filterParam;
              }).length === 0 && (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">کوئی طالب علم نہیں ملا</p>
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
