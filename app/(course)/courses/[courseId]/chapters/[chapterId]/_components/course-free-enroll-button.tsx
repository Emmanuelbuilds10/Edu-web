"use client";

import { Button } from "@/components/ui/button";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export const CourseFreeEnrollButton = ({
  courseId,
  label = "Enrol for free",
}: {
  courseId: string;
  label?: string;
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    try {
      setIsLoading(true);
      await axios.post(`/api/courses/${courseId}/enroll`);
      toast.success("You are enrolled. Enjoy the course!");
      router.refresh();
    } catch (error) {
      const message =
        axios.isAxiosError(error) && typeof error.response?.data === "string"
          ? error.response.data
          : "Could not enrol. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={onClick} disabled={isLoading} className="w-full" size="sm">
      {isLoading ? "Enrolling..." : label}
    </Button>
  );
};
