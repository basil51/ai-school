import Link from 'next/link'
import { Globe, MessageSquare, Users } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <div className="space-y-3 md:space-y-4 sm:col-span-2 lg:col-span-1">
            <h3 className="text-lg md:text-xl font-bold">AI Teacher</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Revolutionizing education through personalized AI-powered learning experiences.
            </p>
            <div className="flex space-x-3 md:space-x-4">
              <Globe className="w-4 h-4 md:w-5 md:h-5 text-gray-400 hover:text-white transition-colors cursor-pointer" />
              <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-gray-400 hover:text-white transition-colors cursor-pointer" />
              <Users className="w-4 h-4 md:w-5 md:h-5 text-gray-400 hover:text-white transition-colors cursor-pointer" />
            </div>
          </div>
          
          <div className="space-y-3 md:space-y-4">
            <h4 className="font-semibold text-sm md:text-base">Product</h4>
            <ul className="space-y-1.5 md:space-y-2 text-sm text-gray-400">
              <li><Link href="/features" className="hover:text-white transition-colors block py-1">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors block py-1">Pricing</Link></li>
              <li><Link href="/demo" className="hover:text-white transition-colors block py-1">Demo</Link></li>
              <li><Link href="/integrations" className="hover:text-white transition-colors block py-1">Integrations</Link></li>
            </ul>
          </div>
          
          <div className="space-y-3 md:space-y-4">
            <h4 className="font-semibold text-sm md:text-base">Resources</h4>
            <ul className="space-y-1.5 md:space-y-2 text-sm text-gray-400">
              <li><Link href="/blog" className="hover:text-white transition-colors block py-1">Blog</Link></li>
              <li><Link href="/help" className="hover:text-white transition-colors block py-1">Help Center</Link></li>
              <li><Link href="/api-docs" className="hover:text-white transition-colors block py-1">API Docs</Link></li>
              <li><Link href="/community" className="hover:text-white transition-colors block py-1">Community</Link></li>
            </ul>
          </div>
          
          <div className="space-y-3 md:space-y-4">
            <h4 className="font-semibold text-sm md:text-base">Company</h4>
            <ul className="space-y-1.5 md:space-y-2 text-sm text-gray-400">
              <li><Link href="/about" className="hover:text-white transition-colors block py-1">About</Link></li>
              <li><Link href="/careers" className="hover:text-white transition-colors block py-1">Careers</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors block py-1">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors block py-1">Privacy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 md:mt-12 pt-6 md:pt-8 text-center text-xs md:text-sm text-gray-400">
          <p>&copy; 2024 AI Teacher. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
