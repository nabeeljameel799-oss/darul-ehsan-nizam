-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  father_name TEXT NOT NULL,
  class_name TEXT NOT NULL CHECK (class_name IN ('قاعدہ', 'ناظرہ', 'حفظ')),
  monthly_fee INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'leave')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(student_id, date)
);

-- Create fees table
CREATE TABLE public.fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  month TEXT NOT NULL,
  amount_paid INTEGER NOT NULL,
  date_paid TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(student_id, month)
);

-- Enable Row Level Security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admin only in this case)
CREATE POLICY "Authenticated users can view students"
  ON public.students FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert students"
  ON public.students FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update students"
  ON public.students FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete students"
  ON public.students FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view attendance"
  ON public.attendance FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert attendance"
  ON public.attendance FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update attendance"
  ON public.attendance FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete attendance"
  ON public.attendance FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view fees"
  ON public.fees FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert fees"
  ON public.fees FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update fees"
  ON public.fees FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete fees"
  ON public.fees FOR DELETE
  USING (auth.role() = 'authenticated');