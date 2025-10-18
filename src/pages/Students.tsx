// ===== NAYA CODE BARAYE StudentsPage.tsx =====

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { ProtectedRoute } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const StudentCard = ({ student, onDelete, onEdit }) => (
  <div className="bg-card text-card-foreground p-4 rounded-lg shadow-sm border space-y-3">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xl font-bold">{student.name}</p>
        <p className="text-sm text-muted-foreground">{student.father_name}</p>
      </div>
      <p className="text-sm font-semibold bg-primary/10 text-primary px-2 py-1 rounded whitespace-nowrap">
        {student.class_name}
      </p>
    </div>
    <div className="flex justify-between items-center pt-3 border-t">
       <p className="text-lg font-semibold">
         {student.monthly_fee} <span className="text-sm text-muted-foreground">روپے</span>
       </p>
       <div className="flex gap-x-2">
         <Button variant="outline" size="icon" onClick={() => onEdit(student)}>
           <Pencil className="h-4 w-4" />
         </Button>
         <Button variant="destructive" size="icon" onClick={() => onDelete(student.id)}>
           <Trash2 className="h-4 w-4" />
         </Button>
       </div>
    </div>
  </div>
);


const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("all");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const { data: classData } = await supabase.from('students').select('class_name');
    const uniqueClasses = [...new Set(classData.map(c => c.class_name))];
    setClasses(uniqueClasses);
    fetchStudents();
  };
  
  const fetchStudents = async () => {
    let query = supabase.from("students").select("*").order('created_at', { ascending: false });
    if (selectedClass !== "all") {
      query = query.eq('class_name', selectedClass);
    }
    const { data } = await query;
    setStudents(data || []);
  };
  
  useEffect(() => {
    fetchStudents();
  }, [selectedClass]);


  const handleDelete = async (id) => {
    await supabase.from("students").delete().eq("id", id);
    fetchStudents();
  };
  
  const handleEdit = (student) => {
    console.log("Editing student:", student);
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-1">طلباء</h2>
              <p className="text-muted-foreground">تمام طلباء کی فہرست دیکھیں اور منظم کریں</p>
            </div>
            <div className="flex items-center gap-2">
                {/* --- IS DROPDOWN KO THEEK KIYA GAYA HAI --- */}
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="درجہ منتخب کریں" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">تمام طلباء</SelectItem>
                        {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Button>
                    <PlusCircle className="h-4 w-4 ml-2" />
                    نیا طالب علم
                </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {students.map((student) => (
              <StudentCard key={student.id} student={student} onDelete={handleDelete} onEdit={handleEdit} />
            ))}
          </div>

          <div className="hidden md:block border rounded-lg">
            <Table>
              <TableHeader><TableRow><TableHead>نام</TableHead><TableHead>والد کا نام</TableHead><TableHead>درجہ</TableHead><TableHead>ماہانہ فیس</TableHead><TableHead className="text-right">کارروائی</TableHead></TableRow></TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell><TableCell>{student.father_name}</TableCell><TableCell>{student.class_name}</TableCell><TableCell>{student.monthly_fee}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-x-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(student)}>ترمیم</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(student.id)}>حذف کریں</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default StudentsPage;
