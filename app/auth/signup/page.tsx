// "use client"

// import type React from "react"
// import { useState } from "react"
// import { useAuth } from "@/contexts/auth-context"
// import { useRouter } from "next/navigation"
// import { getPlatformSettings } from "@/lib/firebase-utils"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Alert, AlertDescription } from "@/components/ui/alert"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { BookOpen, Upload, CheckCircle } from "lucide-react"
// import Link from "next/link"

// export default function SignUpPage() {
//   const router = useRouter()
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//     mobileNumber: "",
//     profileImage: "",
//   })
//   const [error, setError] = useState("")
//   const [success, setSuccess] = useState(false)
//   const [isAutoApproved, setIsAutoApproved] = useState(false)
//   const [redirecting, setRedirecting] = useState(false)
//   const { signUp, authLoading } = useAuth()

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFormData((prev) => ({
//       ...prev,
//       [e.target.name]: e.target.value,
//     }))
//   }

//   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (file) {
//       const reader = new FileReader()
//       reader.onloadend = () => {
//         setFormData((prev) => ({
//           ...prev,
//           profileImage: reader.result as string,
//         }))
//       }
//       reader.readAsDataURL(file)
//     }
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setError("")

//     if (formData.password !== formData.confirmPassword) {
//       setError("Passwords do not match")
//       return
//     }

//     if (formData.password.length < 6) {
//       setError("Password must be at least 6 characters")
//       return
//     }

//     try {
//       const userData = {
//         email: formData.email,
//         name: formData.name,
//         mobileNumber: formData.mobileNumber,
//         profileImage: formData.profileImage,
//         role: "student" as const, // Explicitly set role to student
//       }
      
//       // Sign up the user
//       await signUp(userData, formData.password)
      
//       // Check if auto-approval is enabled
//       const platformSettings = await getPlatformSettings()
//       const autoApproved = platformSettings.autoApproveStudents || false
      
//       console.log("Signup successful, auto-approval status:", autoApproved)
      
//       setIsAutoApproved(autoApproved)
//       setSuccess(true)
      
//       // If auto-approved, redirect to dashboard after a brief delay
//       if (autoApproved) {
//         setRedirecting(true)
//         setTimeout(() => {
//           router.push("/dashboard")
//         }, 2000) // 2 second delay to show success message
//       }
//     } catch (err: any) {
//       setError(err.message || "Failed to create account")
//     }
//   }

//   if (success) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
//         <Card className="w-full max-w-md">
//           <CardHeader className="text-center">
//             <div className="flex justify-center mb-4">
//               {isAutoApproved ? (
//                 <CheckCircle className="h-12 w-12 text-green-600" />
//               ) : (
//                 <BookOpen className="h-12 w-12 text-orange-600" />
//               )}
//             </div>
//             <CardTitle className="text-2xl">
//               {isAutoApproved ? "Welcome to LinuxWorld!" : "Registration Successful!"}
//             </CardTitle>
//             <CardDescription>
//               {isAutoApproved ? (
//                 <>
//                   Your account has been automatically approved! 
//                   {redirecting ? " Redirecting to dashboard..." : " You can now access all student features."}
//                 </>
//               ) : (
//                 "Your LinuxWorld account has been created and is pending approval from an administrator. You will receive an email once your account is approved."
//               )}
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             {isAutoApproved ? (
//               <div className="space-y-3">
//                 {redirecting ? (
//                   <div className="flex items-center justify-center py-4">
//                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//                   </div>
//                 ) : (
//                   <Button asChild className="w-full">
//                     <Link href="/dashboard">Go to Dashboard</Link>
//                   </Button>
//                 )}
//               </div>
//             ) : (
//               <Button asChild className="w-full">
//                 <Link href="/auth/signin">Return to Sign In</Link>
//               </Button>
//             )}
//           </CardContent>
//         </Card>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
//       <Card className="w-full max-w-md">
//         <CardHeader className="text-center">
//           <div className="flex justify-center mb-4">
//             <BookOpen className="h-12 w-12 text-blue-600" />
//           </div>
//           <CardTitle className="text-2xl">Join LinuxWorld</CardTitle>
//           <CardDescription>Create your LinuxWorld classroom account</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             {error && (
//               <Alert variant="destructive">
//                 <AlertDescription>{error}</AlertDescription>
//               </Alert>
//             )}

//             <div className="flex justify-center">
//               <div className="relative">
//                 <Avatar className="h-20 w-20">
//                   <AvatarImage src={formData.profileImage || "/placeholder.svg"} />
//                   <AvatarFallback>{formData.name ? formData.name.charAt(0).toUpperCase() : "U"}</AvatarFallback>
//                 </Avatar>
//                 <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full cursor-pointer hover:bg-blue-700">
//                   <Upload className="h-3 w-3" />
//                   <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
//                 </label>
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="name">Full Name *</Label>
//               <Input
//                 id="name"
//                 name="name"
//                 type="text"
//                 value={formData.name}
//                 onChange={handleInputChange}
//                 required
//                 placeholder="Enter your full name"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="email">Email *</Label>
//               <Input
//                 id="email"
//                 name="email"
//                 type="email"
//                 value={formData.email}
//                 onChange={handleInputChange}
//                 required
//                 placeholder="Enter your email"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="mobileNumber">Mobile Number</Label>
//               <Input
//                 id="mobileNumber"
//                 name="mobileNumber"
//                 type="tel"
//                 value={formData.mobileNumber}
//                 onChange={handleInputChange}
//                 placeholder="Enter your mobile number"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="password">Password *</Label>
//               <Input
//                 id="password"
//                 name="password"
//                 type="password"
//                 value={formData.password}
//                 onChange={handleInputChange}
//                 required
//                 placeholder="Enter your password"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="confirmPassword">Confirm Password *</Label>
//               <Input
//                 id="confirmPassword"
//                 name="confirmPassword"
//                 type="password"
//                 value={formData.confirmPassword}
//                 onChange={handleInputChange}
//                 required
//                 placeholder="Confirm your password"
//               />
//             </div>

//             <Button type="submit" className="w-full" disabled={authLoading}>
//               {authLoading ? "Creating Account..." : "Create Account"}
//             </Button>
//           </form>

//           <div className="mt-6 text-center text-sm">
//             <span className="text-muted-foreground">Already have an account? </span>
//             <Link href="/auth/signin" className="text-blue-600 hover:underline">
//               Sign in
//             </Link>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }



"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { getPlatformSettings } from "@/lib/firebase-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookOpen, Upload, CheckCircle, Mail, ArrowLeft, RefreshCw, Loader2 } from "lucide-react"
import Link from "next/link"

// OTP generation function
function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export default function SignUpPage() {
  const router = useRouter()
  const { signUp, authLoading } = useAuth()
  
  // Form data state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    mobileNumber: "",
    profileImage: "",
  })
  
  // UI states
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isAutoApproved, setIsAutoApproved] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  
  // OTP related states
  const [showOTPVerification, setShowOTPVerification] = useState(false)
  const [generatedOTP, setGeneratedOTP] = useState("")
  const [otpInputs, setOTPInputs] = useState(["", "", "", ""])
  const [otpTimer, setOTPTimer] = useState(600) // 10 minutes in seconds
  const [isResending, setIsResending] = useState(false)
  const [isSendingOTP, setIsSendingOTP] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  // Timer for OTP expiration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showOTPVerification && otpTimer > 0) {
      interval = setInterval(() => {
        setOTPTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [showOTPVerification, otpTimer])

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  // Handle profile image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("Image size should be less than 5MB")
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          profileImage: reader.result as string,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle OTP input changes
  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) return // Only allow single digit
    
    const newOTPInputs = [...otpInputs]
    newOTPInputs[index] = value.replace(/\D/g, '') // Only allow digits
    setOTPInputs(newOTPInputs)
    
    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  // Handle backspace in OTP inputs
  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpInputs[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  // Handle paste in OTP inputs
  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 4)
    const digits = pastedData.replace(/\D/g, '').split('')
    
    const newOTPInputs = [...otpInputs]
    digits.forEach((digit, index) => {
      if (index < 4) {
        newOTPInputs[index] = digit
      }
    })
    setOTPInputs(newOTPInputs)
  }

  // Send OTP email
  const sendOTP = async (retryCount = 0): Promise<boolean> => {
    try {
      const newOTP = generateOTP()
      setGeneratedOTP(newOTP)
      
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          otp: newOTP,
          name: formData.name,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP')
      }

      setOTPTimer(600) // Reset timer to 10 minutes
      return true
    } catch (err: any) {
      console.error('OTP sending error:', err)
      
      // Retry logic (max 2 retries)
      if (retryCount < 2) {
        console.log(`Retrying... Attempt ${retryCount + 2}`)
        await new Promise(resolve => setTimeout(resolve, 1000))
        return sendOTP(retryCount + 1)
      }
      
      throw err
    }
  }

  // Handle initial form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate form
    if (!formData.name.trim()) {
      setError("Name is required")
      return
    }

    if (!formData.email.trim()) {
      setError("Email is required")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    // Send OTP
    setIsSendingOTP(true)
    try {
      const sent = await sendOTP()
      if (sent) {
        setShowOTPVerification(true)
        setOTPInputs(["", "", "", ""])
      }
    } catch (err) {
      setError("Failed to send verification code. Please try again.")
    } finally {
      setIsSendingOTP(false)
    }
  }

  // Handle OTP verification
  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const otpString = otpInputs.join("")
    
    if (otpString.length !== 4) {
      setError("Please enter all 4 digits of the verification code")
      return
    }

    if (otpTimer <= 0) {
      setError("Verification code has expired. Please request a new one.")
      return
    }

    if (otpString !== generatedOTP) {
      setError("Invalid verification code. Please try again.")
      // Clear OTP inputs on error
      setOTPInputs(["", "", "", ""])
      document.getElementById('otp-0')?.focus()
      return
    }

    // Create account
    setIsVerifying(true)
    try {
      const userData = {
        email: formData.email,
        name: formData.name,
        mobileNumber: formData.mobileNumber,
        profileImage: formData.profileImage,
        role: "student" as const,
      }
      
      // Sign up the user
      await signUp(userData, formData.password)
      
      // Check if auto-approval is enabled
      const platformSettings = await getPlatformSettings()
      const autoApproved = platformSettings.autoApproveStudents || false
      
      setIsAutoApproved(autoApproved)
      setSuccess(true)
      
      // If auto-approved, redirect to dashboard
      if (autoApproved) {
        setRedirecting(true)
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account")
    } finally {
      setIsVerifying(false)
    }
  }

  // Handle resend OTP
  const handleResendOTP = async () => {
    setIsResending(true)
    setError("")
    try {
      const sent = await sendOTP()
      if (sent) {
        setOTPInputs(["", "", "", ""])
        document.getElementById('otp-0')?.focus()
      }
    } catch (err) {
      setError("Failed to resend verification code. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {isAutoApproved ? (
                <CheckCircle className="h-12 w-12 text-green-600" />
              ) : (
                <BookOpen className="h-12 w-12 text-orange-600" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {isAutoApproved ? "Welcome to LinuxWorld!" : "Registration Successful!"}
            </CardTitle>
            <CardDescription>
              {isAutoApproved ? (
                <>
                  Your account has been automatically approved! 
                  {redirecting ? " Redirecting to dashboard..." : " You can now access all student features."}
                </>
              ) : (
                "Your LinuxWorld account has been created and is pending approval from an administrator. You will receive an email once your account is approved."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAutoApproved ? (
              <div className="space-y-3">
                {redirecting ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <Button asChild className="w-full">
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                )}
              </div>
            ) : (
              <Button asChild className="w-full">
                <Link href="/auth/signin">Return to Sign In</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // OTP Verification Screen
  if (showOTPVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Mail className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a verification code to <br />
              <span className="font-medium text-gray-900">{formData.email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOTPVerification} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Enter Verification Code</Label>
                                <div className="flex gap-2 justify-center">
                  {otpInputs.map((digit, index) => (
                    <Input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOTPChange(index, e.target.value)}
                      onKeyDown={(e) => handleOTPKeyDown(index, e)}
                      onPaste={index === 0 ? handleOTPPaste : undefined}
                      className="w-14 h-14 text-center text-2xl font-bold"
                      required
                    />
                  ))}
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                {otpTimer > 0 ? (
                  <span>Code expires in <span className="font-medium">{formatTime(otpTimer)}</span></span>
                ) : (
                  <span className="text-red-600">Code expired</span>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isVerifying || otpInputs.join("").length !== 4}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Create Account"
                )}
              </Button>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowOTPVerification(false)
                    setError("")
                  }}
                  className="text-sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResendOTP}
                  disabled={isResending || otpTimer > 540} // Disable for first 60 seconds
                  className="text-sm"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Resend Code
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center text-xs text-muted-foreground">
                Didn't receive the code? Check your spam folder
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main signup form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <BookOpen className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Join LinuxWorld</CardTitle>
          <CardDescription>Create your LinuxWorld classroom account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-center">
              <div className="relative group">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={formData.profileImage || "/placeholder.svg"} />
                  <AvatarFallback>{formData.name ? formData.name.charAt(0).toUpperCase() : "U"}</AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                  <Upload className="h-3 w-3" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="hidden" 
                  />
                </label>
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="text-white text-xs">Upload</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter your full name"
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input
                id="mobileNumber"
                name="mobileNumber"
                type="tel"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                placeholder="Enter your mobile number"
                autoComplete="tel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Create a password (min 6 characters)"
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSendingOTP}
            >
              {isSendingOTP ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending verification code...
                </>
              ) : (
                "Continue"
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/auth/signin" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}