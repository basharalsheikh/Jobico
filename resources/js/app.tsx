import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';

import {
    getSite,
    getPublicPage,
    getProjects,
    sendContactMessage,
    type Project,
    type PublicPage,
    type Site,
} from './services/site';

import { getHome, type HeroSlide } from './services/home';

const heroContent = {
    eyebrow: 'BUILT ON EXPERIENCE. DRIVEN BY PROGRESS.',
    title: 'Building trust.',
    highlight: 'Shaping the future.',
    description:
        'Decades of experience in excavation, infrastructure and construction.',
};

const heroVideos = [
    '/videos/jobico-hero-1.mp4',
    '/videos/jobico-hero-2.mp4',
    '/videos/jobico-hero-3.mp4',
];

type ExpertiseSectionItem = {
    number: string;
    title: string;
    description: string;
};

type ProjectsSectionItem = {
    number: string;
    title: string;
    description: string;
    category: string;
};

type VisibleProjectItem = ProjectsSectionItem & {
    imageUrls: string[];
};

type SectionContent = Record<string, unknown>;

function asRecord(value: unknown): SectionContent {
    if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
    ) {
        return value as SectionContent;
    }

    return {};
}

function readText(value: unknown, fallback: string): string {
    return typeof value === 'string' ? value : fallback;
}

const expertiseItems: ExpertiseSectionItem[] = [
    {
        number: '01',
        title: 'Excavation & Earthworks',
        description: 'Site preparation, excavation and earthmoving.',
    },
    {
        number: '02',
        title: 'Excavation Support',
        description: 'Support for safe and reliable excavation works.',
    },
    {
        number: '03',
        title: 'Infrastructure & Roadworks',
        description: 'Road construction and infrastructure development.',
    },
    {
        number: '04',
        title: 'Bridges & Tunnels',
        description: 'Civil engineering for major infrastructure projects.',
    },
    {
        number: '05',
        title: 'Materials & Recycling',
        description: 'Quarry operations and construction materials.',
    },
];

const defaultEditorialProjects: ProjectsSectionItem[] = [
    {
        number: '01',
        title: 'Infrastructure & Roads',
        description: 'Roads, networks and infrastructure',
        category: 'INFRASTRUCTURE',
    },
    {
        number: '02',
        title: 'Excavation & Earthworks',
        description: 'Site preparation and ground engineering',
        category: 'EARTHWORKS',
    },
    {
        number: '03',
        title: 'Bridges & Tunnels',
        description: 'Complex civil engineering works',
        category: 'CIVIL ENGINEERING',
    },
];

function useCountUp(
    target: number,
    started: boolean,
    duration = 1800,
) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!started) return;

        let frameId = 0;
        let startTime: number | null = null;

        const animate = (timestamp: number) => {
            if (startTime === null) {
                startTime = timestamp;
            }

            const progress = Math.min(
                (timestamp - startTime) / duration,
                1,
            );

            const easedProgress = 1 - Math.pow(1 - progress, 4);

            setCount(Math.round(target * easedProgress));

            if (progress < 1) {
                frameId = window.requestAnimationFrame(animate);
            }
        };

        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;

        if (prefersReducedMotion) {
            setCount(target);
        } else {
            frameId = window.requestAnimationFrame(animate);
        }

        return () => window.cancelAnimationFrame(frameId);
    }, [target, started, duration]);

    return count;
}

function App() {
    const [modalOpen, setModalOpen] = useState(false);
    const [site, setSite] = useState<Site | null>(null);
    const [siteError, setSiteError] = useState(false);
    const [inquirySubmitted, setInquirySubmitted] = useState(false);
    const [inquirySubmitting, setInquirySubmitting] = useState(false);
    const [inquiryError, setInquiryError] = useState('');

    const [statsStarted, setStatsStarted] = useState(false);
    const [activeHeroVideo, setActiveHeroVideo] = useState(0);

    const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
    const [homePage, setHomePage] = useState<PublicPage | null>(null);
    const [publishedProjects, setPublishedProjects] = useState<Project[]>([]);

    const [activeProject, setActiveProject] =
        useState<VisibleProjectItem | null>(null);

    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const aboutRef = useRef<HTMLElement | null>(null);

    const establishedYear = useCountUp(1965, statsStarted);
    const projectCount = useCountUp(41, statsStarted);

    const useAdminHeroSlides = heroSlides.length > 0;

    const heroSlideCount = useAdminHeroSlides
        ? heroSlides.length
        : heroVideos.length;

    const currentHeroSlide = useAdminHeroSlides
        ? heroSlides[activeHeroVideo]
        : null;

    const currentHeroMedia = currentHeroSlide?.media;

    const currentHeroMediaUrl = currentHeroMedia
        ? currentHeroMedia.disk === 'legacy_hero_videos'
            ? `/videos/${currentHeroMedia.path}`
            : `/api/v1/media/${currentHeroMedia.id}/original`
        : null;

    const currentHeroIsVideo =
        currentHeroMedia?.mime?.startsWith('video/') ?? false;

    // Load global site settings.
    useEffect(() => {
        let cancelled = false;

        getSite()
            .then((data) => {
                if (!cancelled) {
                    setSite(data);
                    setSiteError(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setSiteError(true);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    // Load hero slides.
    useEffect(() => {
        let cancelled = false;

        getHome()
            .then((data) => {
                if (!cancelled) {
                    setHeroSlides(data.hero_slides ?? []);
                }
            })
            .catch((error) => {
                console.error('Failed to load hero slides:', error);

                if (!cancelled) {
                    setHeroSlides([]);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    // Load published projects, including their cover images and galleries.
    useEffect(() => {
        let cancelled = false;

        getProjects()
            .then((data) => {
                if (!cancelled) {
                    setPublishedProjects(data);
                }
            })
            .catch((error) => {
                console.error(
                    'Failed to load published projects:',
                    error,
                );
            });

        return () => {
            cancelled = true;
        };
    }, []);

    // Load editable homepage section content.
    useEffect(() => {
        let cancelled = false;

        getPublicPage('home')
            .then((data) => {
                if (!cancelled) {
                    setHomePage(data);
                }
            })
            .catch((error) => {
                console.error(
                    'Failed to load homepage content:',
                    error,
                );
            });

        return () => {
            cancelled = true;
        };
    }, []);

    // Rotate hero slides automatically.
    useEffect(() => {
        if (heroSlideCount <= 1) {
            setActiveHeroVideo(0);
            return;
        }

        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;

        if (prefersReducedMotion) return;

        const interval = window.setInterval(() => {
            setActiveHeroVideo(
                (current) => (current + 1) % heroSlideCount,
            );
        }, 8000);

        return () => window.clearInterval(interval);
    }, [heroSlideCount]);

    // Start the statistics animation when the About section is visible.
    useEffect(() => {
        const section = aboutRef.current;

        if (!section || statsStarted) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setStatsStarted(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.25 },
        );

        observer.observe(section);

        return () => observer.disconnect();
    }, [statsStarted]);

    // Manage Escape, gallery arrow keys, and page scrolling for open modals.
    useEffect(() => {
        const galleryIsOpen = activeProject !== null;

        if (!modalOpen && !galleryIsOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setModalOpen(false);
                setActiveProject(null);
                return;
            }

            if (
                !galleryIsOpen ||
                !activeProject ||
                activeProject.imageUrls.length <= 1
            ) {
                return;
            }

            const imageCount = activeProject.imageUrls.length;

            if (event.key === 'ArrowRight') {
                event.preventDefault();

                setActiveImageIndex(
                    (current) => (current + 1) % imageCount,
                );
            }

            if (event.key === 'ArrowLeft') {
                event.preventDefault();

                setActiveImageIndex(
                    (current) =>
                        (current - 1 + imageCount) % imageCount,
                );
            }
        };

        const previousOverflow = document.body.style.overflow;

        document.body.style.overflow = 'hidden';

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [modalOpen, activeProject]);

    /*
     * Homepage content from the public Pages API.
     * These values are separate from the global Site settings.
     */

    const homeContent = asRecord(homePage?.content);

    const expertiseSection = asRecord(
        homeContent.expertise_section,
    );

    const projectsSection = asRecord(
        homeContent.projects_section,
    );

    const visibleExpertiseItems: ExpertiseSectionItem[] =
        Array.isArray(expertiseSection.items)
            ? (expertiseSection.items as ExpertiseSectionItem[])
            : expertiseItems;

    // Prefer real published projects.
    const visibleProjectsItems: VisibleProjectItem[] =
        publishedProjects.map((project, index) => {
            const mediaItems = [
                ...(project.cover_media
                    ? [project.cover_media]
                    : []),
                ...(project.gallery ?? []),
            ];

            const imageUrls = Array.from(
                new Set(
                    mediaItems.map(
                        (media) =>
                            `/api/v1/media/${media.id}/original`,
                    ),
                ),
            );

            return {
                number: String(index + 1).padStart(2, '0'),
                title: project.title,
                description:
                    project.description?.trim() ||
                    project.summary?.trim() ||
                    project.location ||
                    '',
                category: project.category?.name || 'PROJECT',
                imageUrls,
            };
        });

    const imageMediaId = expertiseSection.image_media_id;

    const expertiseImageUrl =
        typeof imageMediaId === 'number' &&
        Number.isInteger(imageMediaId) &&
        imageMediaId > 0
            ? `/api/v1/media/${imageMediaId}/original`
            : 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1800&q=85';

    // Open the inquiry form.
    const openInquiry = () => {
        setInquirySubmitted(false);
        setInquiryError('');
        setModalOpen(true);
    };

    // Send the inquiry to the Laravel contact API.
    const handleInquirySubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        if (inquirySubmitting) return;

        const form = event.currentTarget;
        const formData = new FormData(form);

        const serviceSelect = form.elements.namedItem(
            'service',
        ) as HTMLSelectElement;

        const serviceValue = String(
            formData.get('service') ?? '',
        );

        const serviceLabel =
            serviceSelect.options[serviceSelect.selectedIndex]?.text ??
            serviceValue;

        const projectDetails = String(
            formData.get('message') ?? '',
        ).trim();

        setInquirySubmitting(true);
        setInquiryError('');

        try {
            await sendContactMessage({
                name: String(
                    formData.get('name') ?? '',
                ).trim(),

                email: String(
                    formData.get('email') ?? '',
                ).trim(),

                phone:
                    String(
                        formData.get('phone') ?? '',
                    ).trim() || undefined,

                subject: serviceLabel,

                body: `Service required: ${serviceLabel}\n\nProject details:\n${projectDetails}`,
            });

            setInquirySubmitted(true);
        } catch (error: unknown) {
            setInquiryError(
                error instanceof Error
                    ? error.message
                    : 'Unable to send your inquiry. Please try again.',
            );
        } finally {
            setInquirySubmitting(false);
        }
    };

    // Open a project's image gallery.
    const openProjectGallery = (project: VisibleProjectItem) => {
        setActiveProject(project);
        setActiveImageIndex(0);
    };

    // Close the project's image gallery.
    const closeProjectGallery = () => {
        setActiveProject(null);
        setActiveImageIndex(0);
    };

    // Show the next gallery image.
    const showNextImage = () => {
        if (!activeProject || activeProject.imageUrls.length <= 1) {
            return;
        }

        setActiveImageIndex(
            (current) =>
                (current + 1) % activeProject.imageUrls.length,
        );
    };

    // Show the previous gallery image.
    const showPreviousImage = () => {
        if (!activeProject || activeProject.imageUrls.length <= 1) {
            return;
        }

        setActiveImageIndex(
            (current) =>
                (current - 1 + activeProject.imageUrls.length) %
                activeProject.imageUrls.length,
        );
    };

    return (
        <main className="jobico-site" lang="en">
            {/* HEADER */}

            <header className="site-header">
                <a
                    href="#home"
                    className="brand"
                    aria-label="JOBICO home"
                >
                    {site?.logo_media?.path ? (
                        <img
                            className="brand-logo"
                            src={
                                /^https?:\/\//i.test(
                                    site.logo_media.path,
                                )
                                    ? site.logo_media.path
                                    : `/storage/${site.logo_media.path
                                          .replace(/^\/+/, '')
                                          .replace(/^storage\//, '')}`
                            }
                            alt={site.company_name || 'JOBICO'}
                        />
                    ) : (
                        <span className="brand-mark">
                            <span>J</span>
                        </span>
                    )}

                    <span className="brand-word">
                        {(site?.company_name || 'JOBICO').replace(
                            /\.$/,
                            '',
                        )}
                        <span className="brand-dot">.</span>
                        <small>
                            {site?.header_subtitle ||
                                'CONTRACTING & TRADING'}
                        </small>
                    </span>
                </a>

                <nav
                    className="main-nav"
                    aria-label="Main navigation"
                >
                    <a href="#home">Home</a>
                    <a href="#about">About</a>
                    <a href="#services">Services</a>
                    <a href="#projects">Projects</a>
                    <a href="#contact">Contact</a>
                </nav>
            </header>

            {/* HERO */}

            <section id="home" className="hero-section">
                {currentHeroSlide && currentHeroMediaUrl ? (
                    currentHeroIsVideo ? (
                        <video
                            key={currentHeroSlide.id}
                            className="hero-video"
                            aria-hidden="true"
                            autoPlay
                            muted
                            playsInline
                            loop
                            preload="auto"
                            onCanPlay={(event) => {
                                const video = event.currentTarget;
                                video.muted = true;
                                void video.play().catch(() => {});
                            }}
                        >
                            <source src={currentHeroMediaUrl} />
                        </video>
                    ) : (
                        <img
                            key={currentHeroSlide.id}
                            className="hero-video"
                            src={currentHeroMediaUrl}
                            alt={
                                currentHeroMedia?.alt ||
                                currentHeroSlide.title ||
                                ''
                            }
                            aria-hidden="true"
                        />
                    )
                ) : (
                    <video
                        key={`fallback-${activeHeroVideo}`}
                        className="hero-video"
                        aria-hidden="true"
                        autoPlay
                        muted
                        playsInline
                        loop
                        preload="auto"
                    >
                        <source
                            src={heroVideos[activeHeroVideo]}
                            type="video/mp4"
                        />
                    </video>
                )}

                <div className="hero-grain" aria-hidden="true" />

                <div className="hero-content">
                    <div className="eyebrow hero-eyebrow">
                        <span className="eyebrow-line" />
                        {heroContent.eyebrow}
                    </div>

                    <h1>
                        {heroContent.title}
                        <br />
                        <em>{heroContent.highlight}</em>
                    </h1>

                    <p className="hero-description">
                        {heroContent.description}
                    </p>

                    <div className="hero-actions">
                        <button
                            className="button button-yellow"
                            type="button"
                            onClick={openInquiry}
                        >
                            GET STARTED <span>↗</span>
                        </button>
                    </div>
                </div>

                <div className="hero-side-note">
                    <span className="side-note-rule" />
                    ENGINEERING · EXCAVATION · INFRASTRUCTURE
                </div>

                <div className="hero-bottom">
                    <div className="hero-bottom-label">
                        <span className="pulse-dot" />
                        Built on Experience. Trusted to Deliver.
                    </div>

                    <div className="hero-bottom-year">
                        EST. <strong>1965</strong>
                    </div>
                </div>

                <a className="scroll-cue" href="#about">
                    <span />
                    Scroll to discover
                </a>
            </section>

            {/* ABOUT US */}

            <section
                id="about"
                className="about-section"
                ref={aboutRef}
            >
                <div className="about-container">
                    <div className="about-visual">
                        <div className="about-image-frame">
                            <img
                                src="/images/jobico-about.jpg"
                                alt="Jobico construction and earthworks"
                                loading="lazy"
                            />

                            <div className="about-image-overlay" />
                        </div>

                        <div className="about-experience-card">
                            <span className="about-experience-number">
                                {establishedYear}
                            </span>
                            <span className="about-experience-label">
                                THE YEAR OUR JOURNEY BEGAN
                            </span>
                        </div>

                        <span className="about-visual-caption">
                            EXPERIENCE THAT BUILDS THE FUTURE
                        </span>
                    </div>

                    <div className="about-content">
                        <div className="about-eyebrow">
                            <span />
                            ABOUT JOBICO
                        </div>

                        <h2 className="about-title">
                            Built on experience.
                            <br />
                            <em>Driven by progress.</em>
                        </h2>

                        <p className="about-lead">
                            Building a stronger foundation since 1965.
                        </p>

                        <p className="about-description">
                            Jobico Trading &amp; Contracting began its
                            journey in quarry operations and construction
                            materials before expanding into excavation,
                            infrastructure and roadworks across Damascus
                            and its surrounding areas.
                        </p>

                        <p className="about-description">
                            Over the years, we have developed our
                            capabilities, workforce and equipment to
                            undertake a wide range of construction-related
                            projects. We remain committed to quality,
                            reliable execution and contributing to the
                            development of essential infrastructure.
                        </p>

                        <div className="about-expertise">
                            <div className="about-expertise-item">
                                <span className="about-check">↗</span>
                                Excavation &amp; Earthworks
                            </div>

                            <div className="about-expertise-item">
                                <span className="about-check">↗</span>
                                Infrastructure &amp; Roadworks
                            </div>

                            <div className="about-expertise-item">
                                <span className="about-check">↗</span>
                                Excavation Support
                            </div>

                            <div className="about-expertise-item">
                                <span className="about-check">↗</span>
                                Construction Materials
                            </div>
                        </div>

                        <a className="about-link" href="#projects">
                            DISCOVER OUR PROJECTS
                            <span>↗</span>
                        </a>
                    </div>
                </div>

                <div className="about-stats">
                    <div className="about-stat">
                        <span className="about-stat-number">
                            {projectCount}
                            <span className="about-stat-plus">+</span>
                        </span>
                        <span className="about-stat-label">
                            PROJECTS IN OUR COMPANY RECORD
                        </span>
                    </div>

                    <div className="about-stat-divider" />

                    <div className="about-stat">
                        <span className="about-stat-number">
                            {establishedYear}
                        </span>
                        <span className="about-stat-label">
                            ESTABLISHED IN
                        </span>
                    </div>

                    <div className="about-stat-divider" />

                    <div className="about-stat about-stat-message">
                        <span className="about-stat-heading">
                            Built to last.
                        </span>
                        <span className="about-stat-label">
                            EXPERIENCE. QUALITY. COMMITMENT.
                        </span>
                    </div>
                </div>
            </section>

            {/* OUR EXPERTISE */}

            <section id="services" className="services-overview">
                <div className="services-overview-inner">
                    <div className="services-overview-header">
                        <div>
                            <div className="services-overview-eyebrow">
                                <span />
                                {readText(
                                    expertiseSection.eyebrow,
                                    'WHAT WE DO',
                                )}
                            </div>

                            <h2>
                                {readText(
                                    expertiseSection.title_line_1,
                                    'Our Expertise',
                                )}
                                <br />
                                <em>
                                    {readText(
                                        expertiseSection.title_line_2,
                                        'at a Glance.',
                                    )}
                                </em>
                            </h2>
                        </div>

                        <p>
                            {readText(
                                expertiseSection.description,
                                'From excavation to essential infrastructure, we bring experience, equipment and commitment to every project.',
                            )}
                        </p>
                    </div>

                    <div className="services-overview-image">
                        <img
                            src={expertiseImageUrl}
                            alt="Construction and infrastructure works"
                            loading="lazy"
                        />

                        <div className="services-image-overlay" />

                        <div className="services-image-caption">
                            <span>
                                {readText(
                                    expertiseSection.image_caption_eyebrow,
                                    'BUILT ON EXPERIENCE',
                                )}
                            </span>

                            <strong>
                                {readText(
                                    expertiseSection.image_caption_title,
                                    'Engineering progress since 1965',
                                )}
                            </strong>
                        </div>
                    </div>

                    <div className="services-overview-grid">
                        {visibleExpertiseItems.map((item, index) => (
                            <article
                                className="expertise-card"
                                key={`${item.number}-${index}`}
                            >
                                <div className="expertise-card-top">
                                    <span className="expertise-number">
                                        {item.number}
                                    </span>
                                    <span className="expertise-arrow">
                                        ↗
                                    </span>
                                </div>

                                <h3>{item.title}</h3>
                                <p>{item.description}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* OUR PROJECTS */}

            <section className="projects-editorial" id="projects">
                <div className="projects-editorial-inner">
                    <div className="projects-editorial-meta">
                        <span>
                            {readText(
                                projectsSection.meta_label,
                                'JOBICO / SELECTED WORK',
                            )}
                        </span>

                        <span>
                            {readText(
                                projectsSection.portfolio_label,
                                'PORTFOLIO — 01',
                            )}
                        </span>
                    </div>

                    <div className="projects-editorial-heading">
                        <div>
                            <span className="projects-editorial-eyebrow">
                                {readText(
                                    projectsSection.eyebrow,
                                    'OUR PROJECTS',
                                )}
                            </span>

                            <h2>
                                {readText(
                                    projectsSection.title_line_1,
                                    'Built on Vision.',
                                )}
                                <br />
                                <span>
                                    {readText(
                                        projectsSection.title_line_2,
                                        'Defined by Engineering.',
                                    )}
                                </span>
                            </h2>
                        </div>

                        <p>
                            {readText(
                                projectsSection.description,
                                'Explore our work across infrastructure, earthworks, and civil engineering. Every project starts with a clear vision and a commitment to quality.',
                            )}
                        </p>
                    </div>

                    <div className="projects-editorial-list">
                        {visibleProjectsItems.map((project, index) => (
                            <article
                                className="projects-editorial-item"
                                key={`${project.number}-${index}`}
                                role="button"
                                tabIndex={0}
                                aria-label={`عرض صور مشروع ${project.title}`}
                                onClick={() =>
                                    openProjectGallery(project)
                                }
                                onKeyDown={(event) => {
                                    if (
                                        event.key === 'Enter' ||
                                        event.key === ' '
                                    ) {
                                        event.preventDefault();
                                        openProjectGallery(project);
                                    }
                                }}
                            >
                                <span className="projects-editorial-number">
                                    {project.number}
                                </span>

                                <div className="projects-editorial-item-main">
                                    <h3>{project.title}</h3>
                                    <p>{project.description}</p>
                                </div>

                                <span className="projects-editorial-category">
                                    {project.category}
                                </span>

                                <span
                                    className="projects-editorial-arrow"
                                    aria-hidden="true"
                                >
                                    ↗
                                </span>
                            </article>
                        ))}
                    </div>

                    <div className="projects-editorial-footer">
                        <span>
                            ENGINEERING · CONSTRUCTION · INFRASTRUCTURE
                        </span>
                        <span>JOBICO ©</span>
                    </div>
                </div>
            </section>

            {/* SITE FOOTER */}

            <footer className="site-footer" id="contact">
                <div className="site-footer-main">
                    <div className="footer-brand-column">
                        <a
                            href="#home"
                            className="brand footer-brand"
                            aria-label="JOBICO home"
                        >
                            {site?.logo_media?.path ? (
                                <img
                                    className="brand-logo"
                                    src={
                                        /^https?:\/\//i.test(
                                            site.logo_media.path,
                                        )
                                            ? site.logo_media.path
                                            : `/storage/${site.logo_media.path
                                                  .replace(/^\/+/, '')
                                                  .replace(/^storage\//, '')}`
                                    }
                                    alt={site.company_name || 'JOBICO'}
                                />
                            ) : (
                                <span className="brand-mark">
                                    <span>J</span>
                                </span>
                            )}

                            <span className="brand-word">
                                {(
                                    site?.footer?.company_name ||
                                    'JOBICO'
                                ).replace(/\.$/, '')}
                                <span className="brand-dot">.</span>
                                <small>
                                    {site?.footer?.subtitle ||
                                        'CONTRACTING & TRADING'}
                                </small>
                            </span>
                        </a>

                        <div className="footer-contact-details">
                            {(site?.footer?.address || !siteError) && (
                                <p>
                                    <span aria-hidden="true">📍</span>{' '}
                                    {site?.footer?.address ||
                                        'Kafr Sousa, Damascus, Next to Al-Andalus Hospital, Near Al-Aqqad Mosque'}
                                </p>
                            )}

                            {(site?.footer?.phones?.filter(
                                (phone) => phone.is_visible && phone.value,
                            ) ?? []).length > 0 ? (
                                site!.footer!.phones!
                                    .filter(
                                        (phone) =>
                                            phone.is_visible && phone.value,
                                    )
                                    .map((phone, index) => (
                                        <a
                                            href={`tel:${phone.value.replace(
                                                /[^\d+]/g,
                                                '',
                                            )}`}
                                            key={`${phone.value}-${index}`}
                                        >
                                            <span aria-hidden="true">
                                                ☎
                                            </span>{' '}
                                            {phone.value}
                                        </a>
                                    ))
                            ) : (
                                <>
                                    <a href="tel:0932372772">
                                        <span aria-hidden="true">☎</span>{' '}
                                        0932372772
                                    </a>
                                    <a href="tel:0944484474">
                                        <span aria-hidden="true">☎</span>{' '}
                                        0944484474
                                    </a>
                                    <a href="tel:0944212903">
                                        <span aria-hidden="true">☎</span>{' '}
                                        0944212903
                                    </a>
                                </>
                            )}

                            {site?.footer?.emails
                                ?.filter(
                                    (email) =>
                                        email.is_visible && email.value,
                                )
                                .map((email, index) => (
                                    <a
                                        href={`mailto:${email.value}`}
                                        key={`${email.value}-${index}`}
                                    >
                                        <span aria-hidden="true">✉</span>{' '}
                                        {email.value}
                                    </a>
                                ))}
                        </div>
                    </div>

                    <div className="footer-intro">
                        <span className="footer-label">
                            {site?.footer?.cta_title ||
                                "LET'S BUILD SOMETHING LASTING"}
                        </span>

                        <h2>
                            {site?.footer?.cta_line_1 || 'Have a project'}
                            <br />
                            <em>
                                {site?.footer?.cta_line_2 || 'in mind?'}
                            </em>
                        </h2>

                        <button
                            className="button button-yellow"
                            type="button"
                            onClick={openInquiry}
                        >
                            {site?.footer?.cta_button_text || 'GET STARTED'}{' '}
                            <span>↗</span>
                        </button>
                    </div>

                    <div className="footer-links">
                        <div>
                            <span className="footer-label">EXPLORE</span>
                            <a href="#home">Home</a>
                            <a href="#about">About us</a>
                            <a href="#services">Our expertise</a>
                            <a href="#projects">Our projects</a>
                        </div>

                        <div>
                            <span className="footer-label">
                                GET IN TOUCH
                            </span>

                            <a
                                href="#contact"
                                onClick={(event) => {
                                    event.preventDefault();
                                    openInquiry();
                                }}
                            >
                                Project inquiries ↗
                            </a>
                        </div>
                    </div>
                </div>

                <div className="site-footer-bottom">
                    <span>
                        © {new Date().getFullYear()}{' '}
                        {site?.footer?.company_name || 'JOBICO'}.{' '}
                        {site?.footer?.copyright_text ||
                            'ALL RIGHTS RESERVED.'}
                    </span>

                    <a href="#home">BACK TO TOP ↑</a>
                </div>
            </footer>

            {/* PROJECT GALLERY MODAL */}

            {activeProject && (
                <div
                    className="project-gallery-backdrop"
                    onClick={closeProjectGallery}
                >
                    <section
                        className="project-gallery-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="project-gallery-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="project-gallery-close"
                            onClick={closeProjectGallery}
                            aria-label="إغلاق معرض الصور"
                        >
                            ×
                        </button>

                        <div className="project-gallery-heading">
                            <span>PROJECT GALLERY</span>

                            <h2 id="project-gallery-title">
                                {activeProject.title}
                            </h2>

                            <p>{activeProject.description}</p>
                        </div>

                        {activeProject.imageUrls.length > 0 ? (
                            <>
                                <div className="project-gallery-viewer">
                                    {activeProject.imageUrls.length > 1 && (
                                        <button
                                            type="button"
                                            className="project-gallery-arrow project-gallery-prev"
                                            onClick={showPreviousImage}
                                            aria-label="الصورة السابقة"
                                        >
                                            ‹
                                        </button>
                                    )}

                                    <img
                                        className="project-gallery-main-image"
                                        src={
                                            activeProject.imageUrls[
                                                activeImageIndex
                                            ]
                                        }
                                        alt={`${activeProject.title} - ${
                                            activeImageIndex + 1
                                        }`}
                                    />

                                    {activeProject.imageUrls.length > 1 && (
                                        <button
                                            type="button"
                                            className="project-gallery-arrow project-gallery-next"
                                            onClick={showNextImage}
                                            aria-label="الصورة التالية"
                                        >
                                            ›
                                        </button>
                                    )}
                                </div>

                                {activeProject.imageUrls.length > 1 && (
                                    <div className="project-gallery-thumbnails">
                                        {activeProject.imageUrls.map(
                                            (imageUrl, index) => (
                                                <button
                                                    type="button"
                                                    key={imageUrl}
                                                    className={
                                                        index ===
                                                        activeImageIndex
                                                            ? 'project-gallery-thumbnail is-active'
                                                            : 'project-gallery-thumbnail'
                                                    }
                                                    onClick={() =>
                                                        setActiveImageIndex(
                                                            index,
                                                        )
                                                    }
                                                    aria-label={`عرض الصورة ${
                                                        index + 1
                                                    }`}
                                                    aria-pressed={
                                                        index ===
                                                        activeImageIndex
                                                    }
                                                >
                                                    <img
                                                        src={imageUrl}
                                                        alt=""
                                                    />
                                                </button>
                                            ),
                                        )}
                                    </div>
                                )}

                                <p className="project-gallery-counter">
                                    {activeImageIndex + 1} /{' '}
                                    {activeProject.imageUrls.length}
                                </p>
                            </>
                        ) : (
                            <div className="project-gallery-empty">
                                لا توجد صور مضافة لهذا المشروع بعد.
                            </div>
                        )}
                    </section>
                </div>
            )}

            {/* INQUIRY MODAL */}

            {modalOpen && (
                <div
                    className="modal-backdrop"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setModalOpen(false);
                        }
                    }}
                >
                    <section
                        className="inquiry-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="inquiry-title"
                    >
                        <button
                            type="button"
                            className="modal-close"
                            aria-label="Close inquiry form"
                            onClick={() => setModalOpen(false)}
                        >
                            ×
                        </button>

                        <div className="modal-kicker">
                            <span />
                            START A CONVERSATION
                        </div>

                        <h2 id="inquiry-title">
                            Let’s talk about
                            <br />
                            <em>your project.</em>
                        </h2>

                        {inquirySubmitted ? (
                            <div className="inquiry-success" role="status">
                                <span className="inquiry-success-icon">
                                    ✓
                                </span>

                                <h3>Thank you for reaching out.</h3>

                                <p>
                                    Your inquiry has been successfully sent.
                                    Our team will get back to you soon.
                                </p>

                                <button
                                    type="button"
                                    className="button button-yellow"
                                    onClick={() => setModalOpen(false)}
                                >
                                    CLOSE
                                </button>
                            </div>
                        ) : (
                            <>
                                <p className="modal-intro">
                                    Tell us a little about your project and
                                    the services you need.
                                </p>

                                <form
                                    className="inquiry-form"
                                    onSubmit={handleInquirySubmit}
                                >
                                    <div className="inquiry-field">
                                        <label htmlFor="inquiry-name">
                                            Full name *
                                        </label>

                                        <input
                                            id="inquiry-name"
                                            name="name"
                                            type="text"
                                            autoComplete="name"
                                            placeholder="Your full name"
                                            required
                                            maxLength={120}
                                        />
                                    </div>

                                    <div className="inquiry-field">
                                        <label htmlFor="inquiry-email">
                                            Email address *
                                        </label>

                                        <input
                                            id="inquiry-email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            placeholder="you@company.com"
                                            required
                                            maxLength={254}
                                        />
                                    </div>

                                    <div className="inquiry-field">
                                        <label htmlFor="inquiry-phone">
                                            Phone number
                                        </label>

                                        <input
                                            id="inquiry-phone"
                                            name="phone"
                                            type="tel"
                                            autoComplete="tel"
                                            placeholder="Your phone number"
                                            maxLength={30}
                                        />
                                    </div>

                                    <div className="inquiry-field">
                                        <label htmlFor="inquiry-service">
                                            Service required *
                                        </label>

                                        <select
                                            id="inquiry-service"
                                            name="service"
                                            required
                                            defaultValue=""
                                        >
                                            <option value="" disabled>
                                                Select a service
                                            </option>

                                            <option value="excavation">
                                                Excavation &amp; Earthworks
                                            </option>

                                            <option value="excavation-support">
                                                Excavation Support
                                            </option>

                                            <option value="infrastructure">
                                                Infrastructure &amp; Roadworks
                                            </option>

                                            <option value="bridges-tunnels">
                                                Bridges &amp; Tunnels
                                            </option>

                                            <option value="materials-recycling">
                                                Materials &amp; Recycling
                                            </option>

                                            <option value="other">
                                                Other
                                            </option>
                                        </select>
                                    </div>

                                    <div className="inquiry-field inquiry-field-full">
                                        <label htmlFor="inquiry-message">
                                            Project details *
                                        </label>

                                        <textarea
                                            id="inquiry-message"
                                            name="message"
                                            rows={4}
                                            placeholder="Tell us about your project, location, and requirements..."
                                            required
                                            maxLength={5000}
                                        />
                                    </div>

                                    {inquiryError && (
                                        <p
                                            className="inquiry-error"
                                            role="alert"
                                        >
                                            {inquiryError}
                                        </p>
                                    )}

                                    <button
                                        type="submit"
                                        className="button button-yellow inquiry-submit"
                                        disabled={inquirySubmitting}
                                    >
                                        {inquirySubmitting ? (
                                            'SENDING...'
                                        ) : (
                                            <>
                                                SEND INQUIRY <span>↗</span>
                                            </>
                                        )}
                                    </button>

                                    <p className="inquiry-privacy-note">
                                        Fields marked * are required.
                                    </p>
                                </form>
                            </>
                        )}
                    </section>
                </div>
            )}
        </main>
    );
}

const rootElement = document.getElementById('app');

if (rootElement) {
    createRoot(rootElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    );
}
