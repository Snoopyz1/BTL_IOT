import {
  Link2,
  ExternalLink,
  FileText,
  Send,
} from 'lucide-react';
import type { SocialLinks } from '../../types/user.ts';

function GithubIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

interface DeveloperInfoProps {
  socialLinks: SocialLinks;
}

export default function DeveloperInfo({ socialLinks }: DeveloperInfoProps) {
  const postmanUrl =
    socialLinks.postman || 'https://documenter.getpostman.com/view/smarthome-iot-api';
  const pdfUrl = socialLinks.pdfDocument || '/SmartHome_API_Docs.pdf';
  const pdfName = socialLinks.pdfFileName || 'SmartHome_API_Docs.pdf';

  const items = [
    {
      key: 'github',
      label: 'GitHub Repository',
      url: socialLinks.github || 'https://github.com/Snoopyz1/BTL_IOT',
      icon: GithubIcon,
      bgColor: 'bg-gray-900 text-white',
      borderColor: 'border-surface-200/80 hover:border-gray-400',
      textColor: 'text-surface-800',
      urlColor: 'text-surface-400',
      isDownload: false,
    },
    {
      key: 'figma',
      label: 'Figma',
      url: socialLinks.figma || 'https://figma.com',
      icon: Link2,
      bgColor: 'bg-purple-600 text-white',
      borderColor: 'border-purple-200/80 hover:border-purple-400',
      textColor: 'text-surface-800',
      urlColor: 'text-purple-600/70',
      isDownload: false,
    },
    {
      key: 'postman',
      label: 'Postman API',
      url: postmanUrl,
      icon: Send,
      bgColor: 'bg-orange-500 text-white',
      borderColor: 'border-orange-200/80 hover:border-orange-400',
      textColor: 'text-surface-800',
      urlColor: 'text-orange-600/70',
      isDownload: false,
    },
    {
      key: 'pdf',
      label: 'Tài Liệu PDF',
      url: pdfUrl,
      icon: FileText,
      bgColor: 'bg-red-500 text-white',
      borderColor: 'border-red-200/80 hover:border-red-400',
      textColor: 'text-surface-800',
      urlColor: 'text-red-600/70',
      isDownload: true,
      fileName: pdfName,
    },
  ];

  return (
    <div className="w-full animate-slide-up">
      {/* Horizontal 4-Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.key}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              download={item.isDownload ? item.fileName : undefined}
              className={`glass-card p-4 flex items-center justify-between gap-3 border ${item.borderColor} transition-all duration-200 hover:-translate-y-0.5 group`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl ${item.bgColor} flex items-center justify-center shadow-md flex-shrink-0`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className={`text-sm font-semibold ${item.textColor} group-hover:text-primary-600 transition-colors truncate`}>
                    {item.label}
                  </h4>
                  <p className={`text-xs ${item.urlColor} truncate`}>
                    {item.url}
                  </p>
                </div>
              </div>

              <div className="p-1.5 rounded-lg text-surface-400 group-hover:text-primary-600 transition-colors flex-shrink-0">
                <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
