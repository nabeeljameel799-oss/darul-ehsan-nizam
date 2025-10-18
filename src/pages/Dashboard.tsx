import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle, XCircle, Coffee, DollarSign } from "lucide-react";
import Layout from "@/components/Layout";
import { ProtectedRoute } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    leaveToday: 0,
    pendingFees: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Total students
    const { count: totalStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    // Today's attendance
    const { data: attendance } = await supabase
      .from('attendance')
      .select('status')
      .eq('date', today);

    const presentToday = attendance?.filter(a => a.status === 'present').length || 0;
    const absentToday = attendance?.filter(a => a.status === 'absent').length || 0;
    const leaveToday = attendance?.filter(a => a.status === 'leave').length || 0;

    // Pending fees for current month
    const { data: allStudents } = await supabase
      .from('students')
      .select('id');

    const { data: paidFees } = await supabase
      .from('fees')
      .select('student_id')
      .eq('month', currentMonth);

    const paidStudentIds = new Set(paidFees?.map(f => f.student_id) || []);
    const pendingFees = (allStudents?.length || 0) - paidStudentIds.size;

    setStats({
      totalStudents: totalStudents || 0,
      presentToday,
      absentToday,
      leaveToday,
      pendingFees,
    });
  };

  const statCards = [
    {
      title: "کل طلباء",
      value: stats.totalStudents,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      clickable: false,
    },
    {
      title: "آج حاضر",
      value: stats.presentToday,
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success/10",
      clickable: false,
    },
    {
      title: "آج غیر حاضر",
      value: stats.absentToday,
      icon: XCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      clickable: true,
      onClick: () => navigate('/attendance?filter=absent'),
    },
    {
      title: "آج رخصت پر",
      value: stats.leaveToday,
      icon: Coffee,
      color: "text-accent",
      bgColor: "bg-accent/10",
      clickable: true,
      onClick: () => navigate('/attendance?filter=leave'),
    },
    {
      title: "فیس واجب الادا",
      value: stats.pendingFees,
      icon: DollarSign,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      clickable: true,
      onClick: () => navigate('/fees?filter=pending'),
    },
  ];

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="space-y-3 text-center md:text-right">
  <h2 className="text-3xl font-bold">ڈیش بورڈ</h2>
  
  {/* --- Aapka Naya Khubsurat Box --- */}
  <div className="inline-block mx-auto md:mx-0 bg-primary/10 border-r-4 border-primary p-3 rounded-lg shadow-sm">
    <p className="text-primary font-medium">مدرسہ کی مکمل کارکردگی کا جائزہ</p>
  </div>
</div>
          
          

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card 
                  key={index} 
                  className={`shadow-card hover:shadow-soft transition-shadow ${stat.clickable ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
                  onClick={stat.clickable ? stat.onClick : undefined}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default Dashboard;
