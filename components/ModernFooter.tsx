"use client"
import { Heart, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Send, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { motion } from "framer-motion"
import { useState } from "react"

export function ModernFooter() {
  const [email, setEmail] = useState("")
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubscribe = () => {
    if (email) {
      setIsSubscribed(true)
      setEmail("")
      setTimeout(() => setIsSubscribed(false), 3000)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  }

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-500/10 to-orange-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Brand Section */}
          <motion.div className="space-y-4 lg:col-span-1" variants={itemVariants}>
            <motion.div
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="w-12 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Heart className="w-6 h-6 text-white" />
              </motion.div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                PractoCare
              </span>
            </motion.div>
            <p className="text-gray-400 leading-relaxed text-sm">
              Your trusted healthcare companion. Connect with qualified doctors and take control of your health.
            </p>
            <div className="flex space-x-3">
              {[
                { icon: Facebook, color: "hover:bg-blue-600", delay: 0 },
                { icon: Twitter, color: "hover:bg-blue-400", delay: 0.1 },
                { icon: Instagram, color: "hover:bg-pink-600", delay: 0.2 },
                { icon: Linkedin, color: "hover:bg-blue-700", delay: 0.3 },
              ].map(({ icon: Icon, color, delay }, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay, duration: 0.3 }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`w-10 h-10 rounded-xl ${color} transition-all duration-300 hover:shadow-lg`}
                  >
                    <Icon className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div className="space-y-4" variants={itemVariants}>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Quick Links
            </h3>
            <div className="space-y-2">
              {[
                { href: "/", label: "Home" },
                { href: "/find-doctors", label: "Find Doctors" },
                { href: "/consultations", label: "Consultations" },
                { href: "/about", label: "About Us" },
              ].map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  whileHover={{ x: 5 }}
                >
                  <Link
                    href={link.href}
                    className="block text-gray-400 hover:text-white hover:bg-white/5 px-2 py-1 rounded-lg transition-all duration-200 text-sm"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* For Patients */}
          <motion.div className="space-y-4" variants={itemVariants}>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              For Patients
            </h3>
            <div className="space-y-2">
              {[
                { href: "/search-doctors", label: "Search Doctors" },
                { href: "/appointments", label: "My Appointments" },
                { href: "/profile", label: "My Profile" },
                { href: "/nearby-clinics", label: "Nearby Clinics" },
              ].map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  whileHover={{ x: 5 }}
                >
                  <Link
                    href={link.href}
                    className="block text-gray-400 hover:text-white hover:bg-white/5 px-2 py-1 rounded-lg transition-all duration-200 text-sm"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* For Doctors */}
          <motion.div className="space-y-4" variants={itemVariants}>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
              For Doctors
            </h3>
            <div className="space-y-2">
              {[
                { href: "/doctor/dashboard", label: "Dashboard" },
                { href: "/doctor/profile", label: "Manage Profile" },
                { href: "/doctor/appointments", label: "Appointments" },
                { href: "/auth", label: "Join as Doctor" },
              ].map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  whileHover={{ x: 5 }}
                >
                  <Link
                    href={link.href}
                    className="block text-gray-400 hover:text-white hover:bg-white/5 px-2 py-1 rounded-lg transition-all duration-200 text-sm"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Newsletter Section */}
        <motion.div
          className="border-t border-gray-800/50 pt-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Stay Updated
              </h3>
              <p className="text-gray-400 text-sm">Get health tips and updates delivered to your inbox</p>
            </div>
            <motion.div className="flex space-x-2 w-full md:w-auto" whileHover={{ scale: 1.02 }}>
              <div className="relative flex-1 md:w-64">
                <Input
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 rounded-xl backdrop-blur-sm focus:border-blue-500 transition-all duration-300"
                />
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleSubscribe}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl px-6 transition-all duration-300"
                  disabled={isSubscribed}
                >
                  {isSubscribed ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center space-x-1">
                      <span>✓</span>
                      <span className="hidden sm:inline">Subscribed!</span>
                    </motion.div>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Subscribe</span>
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          className="border-t border-gray-800/50 pt-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Mail, text: "support@practocare.com", color: "text-blue-400" },
              { icon: Phone, text: "+1 (555) 123-4567", color: "text-green-400" },
              { icon: MapPin, text: "123 Healthcare St, Medical City", color: "text-red-400" },
            ].map(({ icon: Icon, text, color }, index) => (
              <motion.div
                key={index}
                className="flex items-center space-x-3 justify-center md:justify-start"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
              >
                <Icon className={`w-5 h-5 ${color}`} />
                <span className="text-gray-400 text-sm">{text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Copyright & Scroll to Top */}
        <motion.div
          className="border-t border-gray-800/50 pt-6 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-gray-400 text-sm text-center sm:text-left">
            © 2024 PractoCare. All rights reserved. |
            <Link href="/privacy" className="hover:text-white transition-colors mx-1">
              Privacy Policy
            </Link>{" "}
            |
            <Link href="/terms" className="hover:text-white transition-colors mx-1">
              Terms of Service
            </Link>
          </p>

          <motion.div whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.9 }}>
            <Button
              onClick={scrollToTop}
              size="icon"
              variant="ghost"
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/20 backdrop-blur-sm transition-all duration-300"
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  )
}
