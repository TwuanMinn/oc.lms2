"use client";

import Link from "next/link";
import { ArrowRight, Users, Star, Clock, PlayCircle } from "lucide-react";
import { ScrollReveal, StaggerGrid, StaggerItem } from "@/components/ui/animated";
import { TiltCard } from "@/components/ui/tilt-card";

const trendingCourses = [
  {
    title: "Full-Stack Next.js Mastery",
    category: "Development",
    rating: 4.9,
    students: "12.4k",
    modules: 14,
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500",
  },
  {
    title: "Advanced UI/UX Animation",
    category: "Design",
    rating: 5.0,
    students: "8.2k",
    modules: 10,
    gradient: "from-rose-500/20 to-orange-500/20",
    iconColor: "text-rose-500",
  },
  {
    title: "Database Architect Pro",
    category: "Backend",
    rating: 4.8,
    students: "6.1k",
    modules: 18,
    gradient: "from-violet-500/20 to-purple-500/20",
    iconColor: "text-violet-500",
  }
];

export function TrendingSection() {
  return (
    <section className="relative py-20 bg-card/30 border-y border-border/40 overflow-hidden">
       <div className="absolute right-0 top-1/2 -z-10 h-96 w-96 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/5 blur-[100px]" />
       
       <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <ScrollReveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">Trending Courses</h2>
              <p className="mt-2 text-muted-foreground">Jumpstart your skills with our most popular picks.</p>
            </div>
            <Link href="/courses" className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1 group">
              View all courses <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </ScrollReveal>

        <StaggerGrid className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {trendingCourses.map((course) => (
            <StaggerItem key={course.title} scale>
              <TiltCard rotationIntensity={10} className="h-full">
                <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-background/60 shadow-sm backdrop-blur-md transition-all hover:border-primary/30 cursor-pointer">
                  <div className={`h-40 w-full bg-linear-to-br ${course.gradient} flex items-center justify-center relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/5" />
                    <PlayCircle className={`h-12 w-12 opacity-50 ${course.iconColor} group-hover:scale-110 group-hover:opacity-80 transition-all duration-300`} />
                  </div>
                  
                  <div className="p-6 flex flex-col grow">
                    <div className="flex items-center justify-between mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <span>{course.category}</span>
                      <span className="flex items-center gap-1 text-amber-500"><Star className="h-3.5 w-3.5 fill-amber-500" /> {course.rating}</span>
                    </div>
                    <h3 className="text-lg font-bold mb-4 group-hover:text-primary transition-colors">{course.title}</h3>
                    
                    <div className="mt-auto flex items-center justify-between text-sm text-muted-foreground border-t border-border/40 pt-4">
                      <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {course.students}</span>
                      <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {course.modules} modules</span>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </StaggerItem>
          ))}
        </StaggerGrid>
       </div>
    </section>
  );
}
