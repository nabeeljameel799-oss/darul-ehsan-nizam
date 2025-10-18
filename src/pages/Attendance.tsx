// ===== NAYA CODE BARAYE AttendancePage.tsx =====

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { ProtectedRoute } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const AttendancePage = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(new Date());

  const dateString = format(date, "yyyy-MM-dd");

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudentsAndAttendance();
    } else {
      setStudents([]);
    }
  }, [selectedClass, date]);
  
  const fetchClasses = async () => {
    const { data } = await supabase.from('students').select('class_name');
    const uniqueClasses = [...new Set(data.map(c => c.class_name))];
    setClasses(uniqueClasses);
  };
  
  const fetchStudentsAndAttendance = async () => {
    const { data: studentData } = await supabase.from("students").select("*").eq('class_name', selectedClass);
    setStudents(studentData || []);
    
    const { data: attendanceData } = await supabase.from("attendance").select("*").eq('date', dateString);
    const attendanceMap = {};
    (attendanceData || []).forEach(att => {
      attendanceMap[att.student_id] = att.status;
    });
    setAttendance(attendanceMap);
  };
  
  const handleMarkAttendance = async (studentId, status) => {
    await supabase
      .from('attendance')
      .upsert({ id: `${dateString}_${studentId}`, student_id: studentId, date: dateString, status: status }, { onConflict: 'id' });
    
    setAttendance(prev => ({...prev, [studentId]: status}));
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-1">حاضری</h2>
            <p className="text-muted-foreground">طلباء کی روزانہ حاضری منظم کریں</p>
          </div>
          
          <div className="bg-card p-4 rounded-lg border space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className="w-full justify-start text-right font-normal">
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {format(date, "PPP", { locale: ar })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>

                {/* --- IS DROPDOWN KO THEEK KIYA GAYA HAI --- */}
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="درجہ منتخب کریں" />
                    </SelectTrigger>
                    <SelectContent>
                        {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
          </div>

          <div className="space-y-3">
            {students.map(student => (
              <div key={student.id} className="bg-card p-4 rounded-lg border flex items-center justify-between">
                <p className="font-bold">{student.name}</p>
                <div className="flex gap-x-2">
                  <Button size="sm" variant={attendance[student.id] === 'present' ? 'success' : 'outline'} onClick={() => handleMarkAttendance(student.id, 'present')}>حاضر</Button>
                  <Button size="sm" variant={attendance[student.id] === 'absent' ? 'destructive' : 'outline'} onClick={() => handleMarkAttendance(student.id, 'absent')}>غیر حاضر</Button>
                  <Button size="sm" variant={attendance[student.id] === 'leave' ? 'accent' : 'outline'} onClick={() => handleMarkAttendance(student.id, 'leave')}>رخصت</Button>
                </div>
              </div>
            ))}
            {selectedClass && students.length === 0 && <p className="text-center text-muted-foreground py-8">اس درجہ میں کوئی طالب علم موجود نہیں۔</p>}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default AttendancePage;
