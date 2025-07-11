import React from 'react';
import { Link } from 'react-router-dom';
import { FiCode, FiUsers, FiMessageSquare, FiCloud, FiZap, FiShield } from 'react-icons/fi';

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-all border border-gray-700 hover:border-blue-500">
    <div className="text-blue-400 mb-4 text-3xl">{icon}</div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);

const Home = () => (
  <div className="bg-gradient-to-br from-gray-900 to-gray-800 min-h-screen">
    {/* Navigation */}
    <nav className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
      <div className="flex items-center">
        <div className="bg-blue-500 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
          <FiCode className="text-white text-xl" />
        </div>
        <span className="text-white text-2xl font-bold">DevSync</span>
      </div>
      
      <div className="hidden md:flex space-x-6">
        <a href="#features" className="text-gray-400 hover:text-white transition">Features</a>
        <a href="#testimonials" className="text-gray-400 hover:text-white transition">Testimonials</a>
        <a href="#pricing" className="text-gray-400 hover:text-white transition">Pricing</a>
      </div>
      
      <div className="flex items-center space-x-4">
        <Link 
          to="/login" 
          className="px-4 py-2 text-gray-300 hover:text-white transition"
        >
          Sign In
        </Link>
        <Link 
          to="/register" 
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white transition"
        >
          Get Started
        </Link>
      </div>
    </nav>

    {/* Hero Section */}
    <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24 lg:py-32">
      <div className="text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white">
          <span className="block">AI-Powered</span>
          <span className="block text-blue-400 mt-2">Developer Collaboration</span>
        </h1>
        
        <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-400">
          Code together in real-time with AI assistance, project management, and cloud execution - all in one platform.
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            to="/register" 
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-lg transition"
          >
            Start Free Trial
          </Link>
          <Link 
            to="/demo" 
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-700 text-base font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 transition"
          >
            <FiZap className="mr-2 text-blue-400" />
            Live Demo
          </Link>
        </div>
        
        <div className="mt-12 max-w-4xl mx-auto bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-2xl">
          <div className="aspect-w-16 aspect-h-9">
            <div className="bg-gray-900 flex items-center justify-center h-full">
              <div className="text-center p-8">
                <div className="inline-flex items-center mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="text-gray-200 font-mono text-left max-w-xl mx-auto">
                  <div className="mb-2"><span className="text-blue-400">$ </span>devsync start-project --ai-assistant</div>
                  <div className="text-green-400 mb-2">✓ Project initialized with AI support</div>
                  <div className="mb-2"><span className="text-blue-400">$ </span>devsync add-collaborator team@email.com</div>
                  <div className="text-green-400">✓ Collaborator added - real-time session started</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Features Section */}
    <div id="features" className="py-16 bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base text-blue-400 font-semibold tracking-wide uppercase">Features</h2>
          <p className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
            Everything your team needs to ship faster
          </p>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-400">
            All-in-one platform for collaborative development with AI superpowers
          </p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<FiCode />}
              title="Real-Time Collaboration"
              description="Code together with your team in real-time with shared terminals, editors, and debugging tools."
            />
            <FeatureCard 
              icon={<FiZap />}
              title="AI-Powered Assistance"
              description="Get AI suggestions for code, debugging help, and automated reviews directly in your workflow."
            />
            <FeatureCard 
              icon={<FiCloud />}
              title="Cloud Execution"
              description="Run and test code directly in secure browser containers with no setup required."
            />
            <FeatureCard 
              icon={<FiUsers />}
              title="Team Management"
              description="Invite collaborators, assign roles, and manage project permissions with ease."
            />
            <FeatureCard 
              icon={<FiMessageSquare />}
              title="Integrated Chat"
              description="Communicate with your team without leaving the IDE with project-specific chat rooms."
            />
            <FeatureCard 
              icon={<FiShield />}
              title="Enterprise Security"
              description="End-to-end encryption, SOC 2 compliance, and granular access controls."
            />
          </div>
        </div>
      </div>
    </div>

    {/* Testimonials */}
    <div id="testimonials" className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base text-blue-400 font-semibold tracking-wide uppercase">Testimonials</h2>
          <p className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
            Trusted by development teams
          </p>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              quote: "DevSync cut our onboarding time in half. New developers are productive on day one with our AI-assisted environment.",
              author: "Sarah Johnson",
              role: "CTO at TechFlow",
              company: "TechFlow"
            },
            {
              quote: "The real-time collaboration features eliminated 80% of our merge conflicts. Our team velocity has never been higher.",
              author: "Michael Chen",
              role: "Lead Engineer",
              company: "NexusAI"
            },
            {
              quote: "With DevSync's AI assistant, we've reduced bugs by 60%. It's like having an extra senior engineer on every team.",
              author: "Emma Rodriguez",
              role: "Engineering Director",
              company: "InnovaSystems"
            }
          ].map((testimonial, index) => (
            <div key={index} className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <div className="text-blue-400 text-5xl mb-4">"</div>
              <p className="text-gray-300 mb-6">"{testimonial.quote}"</p>
              <div className="flex items-center">
                <div className="bg-gray-700 border-2 border-dashed rounded-xl w-12 h-12" />
                <div className="ml-4">
                  <p className="text-lg font-medium text-white">{testimonial.author}</p>
                  <p className="text-blue-400">{testimonial.role}</p>
                  <p className="text-gray-500 text-sm">{testimonial.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* CTA Section */}
    <div className="py-16 bg-gradient-to-r from-blue-900/50 to-indigo-900/50">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
          Ready to transform your development workflow?
        </h2>
        <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-300">
          Join thousands of developers shipping better code faster
        </p>
        <div className="mt-8 flex justify-center">
          <Link 
            to="/register" 
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-lg transition"
          >
            Start Free Trial
            <svg className="ml-2 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
        <p className="mt-4 text-gray-400 text-sm">
          No credit card required • Free for 14 days
        </p>
      </div>
    </div>

    {/* Footer */}
    <footer className="bg-gray-900 py-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center">
            <div className="bg-blue-500 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
              <FiCode className="text-white text-lg" />
            </div>
            <span className="text-white text-xl font-bold">DevSync</span>
          </div>
          
          <div className="mt-6 md:mt-0 flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-white transition">Terms</a>
            <a href="#" className="text-gray-400 hover:text-white transition">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-white transition">Docs</a>
            <a href="#" className="text-gray-400 hover:text-white transition">Status</a>
          </div>
        </div>
        
        <div className="mt-8 border-t border-gray-800 pt-8 text-center">
          <p className="text-gray-500 text-sm">© 2023 DevSync, Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
);

export default Home;