"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Navbar } from "@/components/layout/Navbar";
import { motion } from "motion/react";
import { Award, Download, Calendar, Hash, BookOpen, Linkedin } from "lucide-react";
import { AnimatedPage } from "@/components/ui/animated";
import { useState, useEffect } from "react";

function CertificateSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center py-20">
        <div className="h-[500px] w-[700px] animate-shimmer rounded-2xl" />
      </div>
    </div>
  );
}

export default function CertificatePage() {
  const params = useParams<{ id: string }>();
  const { data: cert, isLoading } = trpc.certificate.verify.useQuery({
    id: params.id,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!cert) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;

    (async () => {
      const { default: confetti } = await import("canvas-confetti");
      if (cancelled) return;

      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          if (interval) clearInterval(interval);
          return;
        }
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    })();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [cert]);

  if (isLoading) return <CertificateSkeleton />;

  if (!cert) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Award className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">Certificate not found</p>
        </div>
      </div>
    );
  }

  const issuedDate = new Date(cert.issuedAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const handleDownloadPDF = async () => {
    const certElement = document.getElementById("certificate-print");
    if (!certElement) return;

    setIsGenerating(true);
    try {
      const [{ toPng }, { jsPDF }] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);
      const dataUrl = await toPng(certElement, { quality: 1, pixelRatio: 2 });
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [certElement.offsetWidth, certElement.offsetHeight]
      });
      pdf.addImage(dataUrl, "PNG", 0, 0, certElement.offsetWidth, certElement.offsetHeight);
      pdf.save(`${cert.studentName.replace(/ /g, "_")}_GreenAcademy_Certificate.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLinkedInShare = () => {
    const date = new Date(cert.issuedAt);
    const urlParams = new URLSearchParams({
      startTask: "CERTIFICATION_NAME",
      name: cert.courseTitle,
      organizationName: "Green Academy",
      issueYear: date.getFullYear().toString(),
      issueMonth: (date.getMonth() + 1).toString(),
      certUrl: `${window.location.origin}/certificates/${params.id}`,
      certId: cert.certificateNumber
    });
    window.open(`https://www.linkedin.com/profile/add?${urlParams.toString()}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <AnimatedPage>
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          {/* Actions bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <h1 className="text-2xl font-bold">Certificate of Completion</h1>
            <div className="flex items-center gap-3 print:hidden">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleLinkedInShare}
                className="flex items-center gap-2 rounded-lg bg-[#0077b5] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0077b5]/90 transition-colors shadow-lg shadow-[#0077b5]/20"
              >
                <Linkedin className="h-4 w-4" />
                Add to Profile
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                disabled={isGenerating}
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                {isGenerating ? "Generating PDF..." : "Download PDF"}
              </motion.button>
            </div>
          </motion.div>

          {/* Certificate Card */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="certificate-card relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-card p-10 sm:p-14 shadow-2xl shadow-primary/5"
            id="certificate-print"
          >
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 h-24 w-24 border-t-4 border-l-4 border-primary/30 rounded-tl-2xl" />
            <div className="absolute top-0 right-0 h-24 w-24 border-t-4 border-r-4 border-primary/30 rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 h-24 w-24 border-b-4 border-l-4 border-primary/30 rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 h-24 w-24 border-b-4 border-r-4 border-primary/30 rounded-br-2xl" />

            {/* Background glow */}
            <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/5 via-transparent to-primary/5" />

            {/* Header */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
              >
                <Award className="h-8 w-8 text-primary" />
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 text-xs font-bold uppercase tracking-[0.25em] text-primary"
              >
                Certificate of Completion
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground"
              >
                Green Academy
              </motion.p>
            </div>

            {/* Recipient */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-10 text-center"
            >
              <p className="text-sm text-muted-foreground">This certifies that</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                {cert.studentName}
              </h2>
              <div className="mx-auto mt-3 h-px w-48 bg-border" />
            </motion.div>

            {/* Course */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-center"
            >
              <p className="text-sm text-muted-foreground">
                has successfully completed the course
              </p>
              <h3 className="mt-2 text-xl font-bold text-primary sm:text-2xl">
                {cert.courseTitle}
              </h3>
            </motion.div>

            {/* Details grid */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 text-primary/60" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider">Issued</p>
                  <p className="font-medium text-foreground">{issuedDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="h-4 w-4 text-primary/60" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider">Certificate ID</p>
                  <p className="font-mono font-medium text-foreground text-xs">{cert.certificateNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground col-span-2 sm:col-span-1">
                <BookOpen className="h-4 w-4 text-primary/60" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider">Platform</p>
                  <p className="font-medium text-foreground">Green Academy</p>
                </div>
              </div>
            </motion.div>

            {/* Signature area */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-12 flex items-end justify-between border-t border-border/50 pt-6"
            >
              <div>
                <div className="h-px w-32 bg-foreground/30" />
                <p className="mt-1 text-xs text-muted-foreground">Instructor Signature</p>
              </div>
              <div className="text-right">
                <div className="h-px w-32 bg-foreground/30 ml-auto" />
                <p className="mt-1 text-xs text-muted-foreground">Date of Issue</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Verification badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 text-center print:hidden"
          >
            <p className="text-xs text-muted-foreground">
              Verify this certificate at{" "}
              <span className="font-mono text-primary">
                greenacademy.com/certificates/{params.id}
              </span>
            </p>
          </motion.div>
        </div>
      </AnimatedPage>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #certificate-print, #certificate-print * { visibility: visible; }
          #certificate-print {
            position: absolute; left: 0; top: 0;
            width: 100%; border: 3px solid #3b82f6 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
