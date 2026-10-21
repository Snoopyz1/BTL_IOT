import {
  GitFork,
  Link2,
  ExternalLink,
  FileText,
  Send,
} from 'lucide-react';
import type { SocialLinks } from '../../types/user.ts';

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
      label: 'GitHub',
      url: socialLinks.github || 'https://github.com',
      icon: GitFork,
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
