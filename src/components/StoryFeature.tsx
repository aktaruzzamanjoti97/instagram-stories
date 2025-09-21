'use client';

import {
	Bookmark,
	Camera,
	ChevronLeft,
	ChevronRight,
	Heart,
	MessageCircle,
	MoreVertical,
	Plus,
	Send,
	Sparkles,
	X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface Story {
	id: string;
	imageData: string;
	timestamp: number;
	username: string;
	avatar?: string;
	viewed?: boolean;
	likes?: number;
	caption?: string;
}

const StoryFeature: React.FC = () => {
	const [stories, setStories] = useState<Story[]>([]);
	const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(
		null
	);
	const [currentStoryProgress, setCurrentStoryProgress] = useState(0);
	const [touchStart, setTouchStart] = useState<number | null>(null);
	const [touchEnd, setTouchEnd] = useState<number | null>(null);
	const [isLiked, setIsLiked] = useState(false);
	const [showHeartAnimation, setShowHeartAnimation] = useState(false);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const storiesScrollRef = useRef<HTMLDivElement>(null);

	// Load stories from localStorage on mount
	useEffect(() => {
		loadStories();
		const cleanupInterval = setInterval(cleanupExpiredStories, 60000);
		return () => clearInterval(cleanupInterval);
	}, []);

	// Check scroll buttons visibility
	useEffect(() => {
		checkScrollButtons();
	}, [stories]);

	// Handle story viewer progress
	useEffect(() => {
		if (selectedStoryIndex !== null) {
			setCurrentStoryProgress(0);
			setIsLiked(false);
			progressIntervalRef.current = setInterval(() => {
				setCurrentStoryProgress((prev) => {
					if (prev >= 100) {
						handleNextStory();
						return 0;
					}
					return prev + 3.33; // 3 seconds per story
				});
			}, 100);
		} else {
			if (progressIntervalRef.current) {
				clearInterval(progressIntervalRef.current);
			}
		}

		return () => {
			if (progressIntervalRef.current) {
				clearInterval(progressIntervalRef.current);
			}
		};
	}, [selectedStoryIndex]);

	const checkScrollButtons = () => {
		if (storiesScrollRef.current) {
			const { scrollLeft, scrollWidth, clientWidth } =
				storiesScrollRef.current;
			setCanScrollLeft(scrollLeft > 0);
			setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
		}
	};

	const scrollStories = (direction: 'left' | 'right') => {
		if (storiesScrollRef.current) {
			const scrollAmount = 200; // Scroll by ~2 story items
			const currentScroll = storiesScrollRef.current.scrollLeft;
			const targetScroll =
				direction === 'left'
					? currentScroll - scrollAmount
					: currentScroll + scrollAmount;

			storiesScrollRef.current.scrollTo({
				left: targetScroll,
				behavior: 'smooth',
			});

			setTimeout(checkScrollButtons, 300);
		}
	};

	const loadStories = () => {
		try {
			const storedStories = localStorage.getItem('stories');
			if (storedStories) {
				const parsedStories: Story[] = JSON.parse(storedStories);
				const validStories = parsedStories.filter(
					(story) => Date.now() - story.timestamp < 24 * 60 * 60 * 1000
				);
				setStories(validStories);
				if (validStories.length !== parsedStories.length) {
					localStorage.setItem('stories', JSON.stringify(validStories));
				}
			}
		} catch (error) {
			console.error('Error loading stories:', error);
		}
	};

	const cleanupExpiredStories = () => {
		setStories((prevStories) => {
			const validStories = prevStories.filter(
				(story) => Date.now() - story.timestamp < 24 * 60 * 60 * 1000
			);
			localStorage.setItem('stories', JSON.stringify(validStories));
			return validStories;
		});
	};

	const handleAddStory = () => {
		fileInputRef.current?.click();
	};

	const handleFileSelect = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith('image/')) {
			alert('Please select an image file');
			return;
		}

		try {
			const base64 = await convertToBase64(file);
			const resizedImage = await resizeImage(base64);

			const usernames = [
				'Alex Chen',
				'Sofia Martinez',
				'Emma Wilson',
				'Liam Johnson',
				'Maya Patel',
			];
			const captions = [
				'Living my best life ✨',
				'Chasing sunsets 🌅',
				'Coffee and vibes ☕️',
				'Weekend mood 🎉',
				'Making memories 📸',
			];

			const newStory: Story = {
				id: `story-${Date.now()}-${Math.random()
					.toString(36)
					.substr(2, 9)}`,
				imageData: resizedImage,
				timestamp: Date.now(),
				username: usernames[Math.floor(Math.random() * usernames.length)],
				avatar: `https://i.pravatar.cc/150?img=${Math.floor(
					Math.random() * 70
				)}`,
				viewed: false,
				likes: Math.floor(Math.random() * 500) + 50,
				caption: captions[Math.floor(Math.random() * captions.length)],
			};

			const updatedStories = [...stories, newStory];
			setStories(updatedStories);
			localStorage.setItem('stories', JSON.stringify(updatedStories));

			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		} catch (error) {
			console.error('Error processing image:', error);
			alert('Error processing image. Please try again.');
		}
	};

	const convertToBase64 = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = (error) => reject(error);
		});
	};

	const resizeImage = async (base64: string): Promise<string> => {
		const response = await fetch(base64);
		const blob = await response.blob();

		const imgBitmap = await createImageBitmap(blob);

		const maxWidth = 1080;
		const maxHeight = 1920;
		let { width, height } = imgBitmap;

		const aspectRatio = width / height;
		if (width > maxWidth) {
			width = maxWidth;
			height = width / aspectRatio;
		}
		if (height > maxHeight) {
			height = maxHeight;
			width = height * aspectRatio;
		}

		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d');
		ctx?.drawImage(imgBitmap, 0, 0, width, height);

		return canvas.toDataURL('image/jpeg', 0.9);
	};

	const openStoryViewer = (index: number) => {
		setSelectedStoryIndex(index);
		const updatedStories = [...stories];
		updatedStories[index].viewed = true;
		setStories(updatedStories);
		localStorage.setItem('stories', JSON.stringify(updatedStories));
	};

	const closeStoryViewer = () => {
		setSelectedStoryIndex(null);
		setCurrentStoryProgress(0);
	};

	const handleNextStory = () => {
		if (
			selectedStoryIndex !== null &&
			selectedStoryIndex < stories.length - 1
		) {
			openStoryViewer(selectedStoryIndex + 1);
		} else {
			closeStoryViewer();
		}
	};

	const handlePrevStory = () => {
		if (selectedStoryIndex !== null && selectedStoryIndex > 0) {
			openStoryViewer(selectedStoryIndex - 1);
		}
	};

	const handleDeleteStory = (storyId: string) => {
		const updatedStories = stories.filter((story) => story.id !== storyId);
		setStories(updatedStories);
		localStorage.setItem('stories', JSON.stringify(updatedStories));
		if (selectedStoryIndex !== null) {
			if (selectedStoryIndex >= updatedStories.length) {
				closeStoryViewer();
			} else {
				setCurrentStoryProgress(0);
			}
		}
	};

	const handleDoubleTap = () => {
		setIsLiked(true);
		setShowHeartAnimation(true);
		setTimeout(() => setShowHeartAnimation(false), 1000);
	};

	const handleTouchStart = (e: React.TouchEvent) => {
		setTouchStart(e.targetTouches[0].clientX);
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		setTouchEnd(e.targetTouches[0].clientX);
	};

	const handleTouchEnd = () => {
		if (!touchStart || !touchEnd) return;
		const distance = touchStart - touchEnd;
		const isLeftSwipe = distance > 50;
		const isRightSwipe = distance < -50;

		if (isLeftSwipe) {
			handleNextStory();
		}
		if (isRightSwipe) {
			handlePrevStory();
		}
	};

	const getTimeAgo = (timestamp: number) => {
		const minutes = Math.floor((Date.now() - timestamp) / 60000);
		if (minutes < 60) return `${minutes}m`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h`;
		return '23h';
	};

	return (
		<div className='min-h-screen bg-black'>
			<div className='max-w-md mx-auto bg-black min-h-screen relative'>
				{/* Animated Background Gradient */}
				<div className='absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-orange-900/20 animate-gradient' />

				{/* Header */}
				<div className='relative bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-4 sticky top-0 z-40'>
					<div className='flex items-center justify-between'>
						<h1 className='text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent'>
							Stories
						</h1>
						<div className='flex items-center gap-3'>
							<button className='p-2 hover:bg-white/10 rounded-full transition-colors'>
								<Sparkles className='w-5 h-5 text-white/80' />
							</button>
							<button className='p-2 hover:bg-white/10 rounded-full transition-colors'>
								<Camera className='w-5 h-5 text-white/80' />
							</button>
						</div>
					</div>
				</div>

				{/* Stories List */}
				<div className='relative bg-gradient-to-b from-black/80 to-black/40 backdrop-blur-lg p-4'>
					<div className='relative'>
						{/* Left Arrow */}
						{canScrollLeft && stories.length > 3 && (
							<button
								onClick={() => scrollStories('left')}
								className='absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/60 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-black/80 transition-all duration-300 shadow-lg'>
								<ChevronLeft className='w-5 h-5 text-white' />
							</button>
						)}

						{/* Right Arrow */}
						{canScrollRight && stories.length > 3 && (
							<button
								onClick={() => scrollStories('right')}
								className='absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/60 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-black/80 transition-all duration-300 shadow-lg'>
								<ChevronRight className='w-5 h-5 text-white' />
							</button>
						)}

						<div
							ref={storiesScrollRef}
							onScroll={checkScrollButtons}
							className='flex gap-4 overflow-x-auto scrollbar-hide pb-2 scroll-smooth'>
							{/* Add Story Button */}
							<div className='flex-shrink-0'>
								<button
									onClick={handleAddStory}
									className='relative group'>
									<div className='w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 p-[2px] group-hover:scale-105 transition-all duration-300 shadow-xl shadow-purple-500/25'>
										<div className='w-full h-full rounded-2xl bg-black/40 backdrop-blur flex items-center justify-center'>
											<div className='w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xl flex items-center justify-center group-hover:bg-white/20 transition-colors'>
												<Plus
													className='w-6 h-6 text-white'
													strokeWidth={2.5}
												/>
											</div>
										</div>
									</div>
									<span className='absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-white/80 font-medium whitespace-nowrap mt-1'>
										Your Story
									</span>
								</button>
							</div>

							{/* Story Items */}
							{stories.map((story, index) => (
								<div key={story.id} className='flex-shrink-0'>
									<button
										onClick={() => openStoryViewer(index)}
										className='relative group'>
										<div
											className={`w-20 h-20 rounded-2xl p-[3px] transition-all duration-300 group-hover:scale-105 ${
												story.viewed
													? 'bg-gradient-to-br from-gray-600 to-gray-700'
													: 'bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 animate-pulse shadow-lg shadow-pink-500/30'
											}`}>
											<div className='w-full h-full rounded-2xl bg-black p-[2px]'>
												<div
													className='w-full h-full rounded-xl bg-cover bg-center'
													style={{
														backgroundImage: story.avatar
															? `url(${story.avatar})`
															: `url(${story.imageData})`,
													}}
												/>
											</div>
										</div>
										<span className='absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-white/80 font-medium whitespace-nowrap mt-1'>
											{story.username?.split(' ')[0]}
										</span>
									</button>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className='relative p-4'>
					{stories.length === 0 ? (
						<div className='bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-orange-900/20 backdrop-blur-xl rounded-3xl p-12 text-center border border-white/10'>
							<div className='mb-6'>
								<div className='w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-purple-500/30'>
									<Camera className='w-10 h-10 text-white' />
								</div>
							</div>
							<h3 className='text-xl font-semibold text-white mb-2'>
								Share Your Story
							</h3>
							<p className='text-white/60 mb-6'>
								Capture moments that disappear in 24 hours
							</p>
							<button
								onClick={handleAddStory}
								className='px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-medium text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300'>
								Create Your First Story
							</button>
						</div>
					) : (
						<div className='space-y-6'>
							<div className='flex items-center justify-between'>
								<h2 className='text-lg font-semibold text-white'>
									Recent Moments
								</h2>
								<button className='text-purple-400 text-sm font-medium hover:text-purple-300 transition-colors'>
									View All
								</button>
							</div>
							<div className='grid grid-cols-2 gap-3'>
								{stories
									.slice(-6)
									.reverse()
									.map((story, idx) => (
										<div
											key={story.id}
											onClick={() =>
												openStoryViewer(stories.indexOf(story))
											}
											className='aspect-[9/16] rounded-2xl bg-cover bg-center cursor-pointer group relative overflow-hidden shadow-xl'
											style={{
												backgroundImage: `url(${story.imageData})`,
											}}>
											<div className='absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
											<div
												className='absolute inset-0 group-hover:scale-105 transition-transform duration-500'
												style={{
													backgroundImage: `url(${story.imageData})`,
													backgroundSize: 'cover',
													backgroundPosition: 'center',
												}}
											/>
											<div className='absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
												<div className='flex items-center gap-2'>
													{story.avatar && (
														<Image
															src={story.avatar}
															className='w-8 h-8 rounded-full border-2 border-white/80'
															alt="Avatar"
															width={1000}
															height={1000}
														/>
													)}
													<div className='flex-1'>
														<p className='text-white text-sm font-medium'>
															{story.username}
														</p>
														<p className='text-white/70 text-xs'>
															{getTimeAgo(story.timestamp)} ago
														</p>
													</div>
												</div>
											</div>
											<div className='absolute top-3 right-3 bg-black/50 backdrop-blur-lg rounded-full px-2 py-1 flex items-center gap-1'>
												<Heart
													className='w-3 h-3 text-white'
													fill='white'
												/>
												<span className='text-white text-xs'>
													{story.likes}
												</span>
											</div>
										</div>
									))}
							</div>
						</div>
					)}
				</div>

				{/* Hidden File Input */}
				<input
					ref={fileInputRef}
					type='file'
					accept='image/*'
					onChange={handleFileSelect}
					className='hidden'
				/>

				{/* Story Viewer Modal */}
				{selectedStoryIndex !== null && stories[selectedStoryIndex] && (
					<div
						className='fixed inset-0 bg-black z-50'
						onTouchStart={handleTouchStart}
						onTouchMove={handleTouchMove}
						onTouchEnd={handleTouchEnd}
						onDoubleClick={handleDoubleTap}>
						<div className='relative h-full'>
							{/* Background Blur Effect */}
							<div
								className='absolute inset-0 scale-110 blur-2xl opacity-30'
								style={{
									backgroundImage: `url(${stories[selectedStoryIndex].imageData})`,
									backgroundSize: 'cover',
									backgroundPosition: 'center',
								}}
							/>

							{/* Progress Bars */}
							<div className='absolute top-0 left-0 right-0 z-30 flex gap-1 p-3 px-4'>
								{stories.map((_, idx) => (
									<div
										key={idx}
										className='flex-1 h-[3px] bg-white/20 rounded-full overflow-hidden backdrop-blur'>
										<div
											className='h-full bg-white rounded-full transition-all duration-100 shadow-lg shadow-white/50'
											style={{
												width:
													idx < selectedStoryIndex
														? '100%'
														: idx === selectedStoryIndex
														? `${currentStoryProgress}%`
														: '0%',
											}}
										/>
									</div>
								))}
							</div>

							{/* Header */}
							<div className='absolute top-8 left-0 right-0 z-30 flex items-center justify-between px-4'>
								<div className='flex items-center gap-3 flex-1'>
									<div className='relative'>
										<div className='w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-[2px]'>
											<div className='w-full h-full rounded-full bg-black p-[2px]'>
												<Image
													src={
														stories[selectedStoryIndex].avatar ||
														`https://i.pravatar.cc/150?img=${selectedStoryIndex}`
													}
													alt="Header"
													width={1000}
													height={1000}
													className='w-full h-full rounded-full object-cover'
												/>
											</div>
										</div>
										<div className='absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-green-500 rounded-full border-2 border-black' />
									</div>
									<div className='flex-1'>
										<div className='flex items-center gap-2'>
											<p className='text-white font-semibold text-sm'>
												{stories[selectedStoryIndex].username}
											</p>
											<span className='text-white/60 text-xs'>
												•
											</span>
											<p className='text-white/60 text-xs'>
												{getTimeAgo(
													stories[selectedStoryIndex].timestamp
												)}
											</p>
										</div>
										<p className='text-white/80 text-xs mt-0.5'>
											{stories[selectedStoryIndex].caption}
										</p>
									</div>
								</div>
								<div className='flex items-center gap-2'>
									<button className='p-2 hover:bg-white/10 rounded-full transition-colors'>
										<MoreVertical className='w-5 h-5 text-white' />
									</button>
									<button
										onClick={closeStoryViewer}
										className='p-2 hover:bg-white/10 rounded-full transition-colors'>
										<X className='w-6 h-6 text-white' />
									</button>
								</div>
							</div>

							{/* Story Image */}
							<div className='h-full flex items-center justify-center px-4 relative'>
								<Image
									src={stories[selectedStoryIndex].imageData}
									alt='Story'
									className='max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl'
									width={1000}
									height={1000}
								/>

								{/* Heart Animation */}
								{showHeartAnimation && (
									<div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
										<Heart
											className='w-32 h-32 text-white animate-ping'
											fill='white'
											style={{ animationDuration: '1s' }}
										/>
									</div>
								)}
							</div>

							{/* Bottom Actions */}
							<div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-20'>
								<div className='flex items-center justify-between'>
									<div className='flex items-center gap-4'>
										<button
											onClick={() => setIsLiked(!isLiked)}
											className='transition-all duration-300 hover:scale-110'>
											<Heart
												className={`w-7 h-7 ${
													isLiked ? 'text-red-500' : 'text-white'
												} transition-colors`}
												fill={isLiked ? 'currentColor' : 'none'}
											/>
										</button>
										<button className='transition-all duration-300 hover:scale-110'>
											<MessageCircle className='w-7 h-7 text-white' />
										</button>
										<button className='transition-all duration-300 hover:scale-110'>
											<Send className='w-6 h-6 text-white' />
										</button>
									</div>
									<button className='transition-all duration-300 hover:scale-110'>
										<Bookmark className='w-6 h-6 text-white' />
									</button>
								</div>
								<div className='mt-3 flex items-center justify-between'>
									<p className='text-white text-sm font-medium'>
										{stories[selectedStoryIndex].likes} likes
									</p>
									<button
										onClick={() => {
											if (
												confirm(
													'Are you sure you want to delete this story?'
												)
											) {
												handleDeleteStory(
													stories[selectedStoryIndex].id
												);
											}
										}}
										className='px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-xl text-red-400 hover:text-red-300 rounded-full text-sm font-medium transition-all duration-300 border border-red-500/30 hover:border-red-500/50 hover:scale-105'>
										Delete Story
									</button>
								</div>
							</div>

							{/* Navigation Areas */}
							<div className='absolute inset-0 flex z-10'>
								<button
									onClick={handlePrevStory}
									className='w-1/3 h-full'
									aria-label='Previous story'
								/>
								<div className='w-1/3 h-full' />
								<button
									onClick={handleNextStory}
									className='w-1/3 h-full'
									aria-label='Next story'
								/>
							</div>

							{/* Navigation Arrows (Desktop) */}
							{selectedStoryIndex > 0 && (
								<button
									onClick={handlePrevStory}
									className='absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-white/20 transition-all hidden md:block z-20'>
									<ChevronLeft className='w-6 h-6' />
								</button>
							)}
							{selectedStoryIndex < stories.length - 1 && (
								<button
									onClick={handleNextStory}
									className='absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-white/20 transition-all hidden md:block z-20'>
									<ChevronRight className='w-6 h-6' />
								</button>
							)}
						</div>
					</div>
				)}
			</div>

			<style jsx>{`
				.scrollbar-hide {
					-ms-overflow-style: none;
					scrollbar-width: none;
				}
				.scrollbar-hide::-webkit-scrollbar {
					display: none;
				}

				@keyframes gradient {
					0% {
						background-position: 0% 50%;
					}
					50% {
						background-position: 100% 50%;
					}
					100% {
						background-position: 0% 50%;
					}
				}

				.animate-gradient {
					background-size: 200% 200%;
					animation: gradient 15s ease infinite;
				}
			`}</style>
		</div>
	);
};

export default StoryFeature;
