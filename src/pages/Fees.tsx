// ===== NAYA CODE BARAYE FeesPage.tsx =====

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { ProtectedRoute } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// --- NAYA AUR BEHTAR MOBILE CARD DESIGN ---
const FeeCard = ({ student, feeStatus, onReceiveFee }) => (
    <div className="bg-card text-card-foreground p-4 rounded-lg shadow-sm border space-y-3">
        <div>
            <p className="text-xl font-bold">{student.name}</p>
            <p className="text-sm text-muted-foreground">{student.father_name}</p>
        </div>
        
        <div className="flex justify-between items-center pt-3 border-t">
            <p className="text-lg font-semibold">
                {student.monthly_fee} <span className="text-sm text-muted-foreground">روپے</span>
            </p>
            {feeStatus.paid ? (
                <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">ادا شدہ</span>
                </div>
            ) : (
                <span className="font-semibold text-destructive">واجب الادا</span>
            )}
        </div>
        
        {!feeStatus.paid && (
            <Button className="w-full" onClick={() => onReceiveFee(student.id, student.monthly_fee)}>
                فیس وصول کریں
            </Button>
        )}
        {feeStatus.paid && (
            <p className="text-sm text-center text-muted-foreground pt-2">
                بتاریخ: {format(new Date(feeStatus.date_paid), "PPP", { locale: ar })}
            </p>
        )}
    </div>
);


const FeesPage = () => {
    const [students, setStudents] = useState([]);
    const [fees, setFees] = useState({});
    const currentMonth = format(new Date(), 'yyyy-MM');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: studentData } = await supabase.from('students').select('*');
        setStudents(studentData || []);

        const { data: feeData } = await supabase.from('fees').select('*').eq('month', currentMonth);
        const feeMap = {};
        (feeData || []).forEach(fee => {
            feeMap[fee.student_id] = { paid: true, date_paid: fee.date_paid };
        });
        setFees(feeMap);
    };

    const handleReceiveFee = async (studentId, amount) => {
        await supabase.from('fees').insert({
            student_id: studentId,
            amount: amount,
            month: currentMonth,
            date_paid: new Date().toISOString()
        });
        fetchData();
    };
    
    return (
        <ProtectedRoute>
            <Layout>
                <div className="space-y-6">
                    <div>
                        <h2 className="text-3xl font-bold mb-1">فیس</h2>
                        <p className="text-muted-foreground">
                           برائے مہینہ: {format(new Date(), "MMMM yyyy", { locale: ar })}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {students.map(student => (
                            <FeeCard 
                                key={student.id} 
                                student={student} 
                                feeStatus={fees[student.id] || { paid: false }}
                                onReceiveFee={handleReceiveFee}
                            />
                        ))}
                    </div>
                </div>
            </Layout>
        </ProtectedRoute>
    );
};

export default FeesPage;
