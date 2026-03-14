import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAppStore } from "@/store/use-app-store";
import { useRegisterCandidate } from "@workspace/api-client-react";
import { AnimatedPage, Button, Card, CardContent, Input, Label, Badge } from "@/components/ui-elements";
import { X, CheckCircle, ArrowRight, UserPlus, BrainCircuit, ScanFace } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [_, setLocation] = useLocation();
  const { candidateId, setCandidateId } = useAppStore();
  const { mutate: register, isPending } = useRegisterCandidate();

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [experience, setExperience] = useState("");
  const [registeredProfile, setRegisteredProfile] = useState<{ id: string } | null>(null);

  useEffect(() => {
    if (candidateId) {
      setLocation("/dashboard");
    }
  }, [candidateId, setLocation]);

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
      }
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRole || !experience || skills.length === 0) return;

    register({
      data: {
        skills,
        targetRole,
        experienceYears: parseInt(experience, 10) || 0
      }
    }, {
      onSuccess: (data) => {
        setRegisteredProfile({ id: data.candidateId });
      }
    });
  };

  if (registeredProfile) {
    return (
      <AnimatedPage className="flex-grow flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center border-primary/20 shadow-xl shadow-primary/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          <CardContent className="pt-10 pb-8 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6"
            >
              <CheckCircle className="w-10 h-10 text-green-600" />
            </motion.div>
            <h2 className="text-3xl font-display font-bold mb-2">Registration Complete</h2>
            <p className="text-muted-foreground mb-8">
              Your identity has been completely anonymized. Please save your Candidate ID. You will need it to access your results.
            </p>
            
            <div className="w-full bg-secondary/50 rounded-xl p-4 mb-8 border border-secondary flex flex-col items-center justify-center">
              <span className="text-sm font-medium text-muted-foreground mb-1">Your Candidate ID</span>
              <span className="text-3xl font-mono font-bold tracking-wider text-primary">
                {registeredProfile.id}
              </span>
            </div>

            <Button 
              size="lg" 
              className="w-full"
              onClick={() => {
                setCandidateId(registeredProfile.id);
                setLocation("/dashboard");
              }}
            >
              Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </CardContent>
        </Card>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
      
      {/* Left side: Copy & Value Prop */}
      <div className="space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-2">
          <ScanFace className="w-4 h-4" />
          Bias-Free Hiring Platform
        </div>
        <h1 className="text-5xl lg:text-6xl font-display font-bold leading-tight">
          Showcase your skills.<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Not your identity.</span>
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
          The Gender-Neutral Skill Assessment Engine removes names, genders, and backgrounds from the hiring equation. You are evaluated purely on your merit, code, and aptitude.
        </p>

        <div className="grid sm:grid-cols-2 gap-6 pt-4">
          <div className="flex gap-4 items-start">
            <div className="p-3 rounded-xl bg-secondary text-foreground">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Skill-First</h3>
              <p className="text-sm text-muted-foreground">Complete technical challenges to prove your worth.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="p-3 rounded-xl bg-secondary text-foreground">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">100% Anonymized</h3>
              <p className="text-sm text-muted-foreground">Recruiters only see your ID, scores, and skills.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Registration Form */}
      <div className="relative">
        {/* Background decorative blob */}
        <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl -z-10 rounded-[3rem]" />
        
        <Card className="border-0 shadow-2xl relative bg-background/60 backdrop-blur-xl">
          <CardContent className="p-8">
            <h2 className="text-2xl font-display font-bold mb-6">Join as a Candidate</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="targetRole">Target Role</Label>
                <Input 
                  id="targetRole" 
                  placeholder="e.g. Frontend Engineer, Data Scientist" 
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="experience">Years of Experience</Label>
                <Input 
                  id="experience" 
                  type="number" 
                  min="0"
                  placeholder="e.g. 3" 
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Skills (Press Enter to add)</Label>
                <div className="min-h-[48px] p-2 rounded-xl border-2 border-input bg-background focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all flex flex-wrap gap-2 items-center">
                  {skills.map(skill => (
                    <Badge key={skill} className="gap-1 px-3 py-1 text-sm bg-secondary text-secondary-foreground hover:bg-secondary">
                      {skill}
                      <X 
                        className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors" 
                        onClick={() => removeSkill(skill)}
                      />
                    </Badge>
                  ))}
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                    placeholder={skills.length === 0 ? "e.g. React, Python, AWS..." : ""}
                    className="flex-grow bg-transparent outline-none border-none text-sm min-w-[120px] px-1 h-8"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full"
                isLoading={isPending}
                disabled={!targetRole || !experience || skills.length === 0}
              >
                Register Anonymously
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

    </AnimatedPage>
  );
}
