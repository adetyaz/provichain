<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';

	const featuredProducts = [
		{
			id: 'PVC-2025-025',
			name: 'Artisan Coffee Collection',
			manufacturer: 'Highland Coffee Co.',
			price: '$89.99',
			rating: 4.9,
			image: '☕',
			location: 'Colombia',
			status: 'In Stock',
			sustainability: 'Organic, Fair Trade',
			description: 'Premium single-origin coffee from Colombian highlands.'
		},
		{
			id: 'PVC-2025-026',
			name: 'Swiss Watch Limited Edition',
			manufacturer: 'Alpine Timepieces',
			price: '$2,499.00',
			rating: 5.0,
			image: '⌚',
			location: 'Switzerland',
			status: 'Pre-Order',
			sustainability: 'Ethically Sourced',
			description: 'Handcrafted mechanical watch with certified provenance.'
		},
		{
			id: 'PVC-2025-027',
			name: 'Organic Tea Sampler',
			manufacturer: 'Mountain Tea Co.',
			price: '$45.50',
			rating: 4.8,
			image: '🫖',
			location: 'Nepal',
			status: 'In Stock',
			sustainability: 'Organic, Carbon Neutral',
			description: 'Curated selection of premium organic teas.'
		},
		{
			id: 'PVC-2025-028',
			name: 'Vintage Wine Collection',
			manufacturer: 'Bordeaux Vineyards',
			price: '$350.00',
			rating: 4.7,
			image: '🍷',
			location: 'France',
			status: 'Limited',
			sustainability: 'Biodynamic',
			description: '2019 vintage with full provenance tracking.'
		}
	];

	const categories = [
		{ name: 'Food & Beverages', count: 1247, icon: '🍽️' },
		{ name: 'Luxury Goods', count: 892, icon: '💎' },
		{ name: 'Electronics', count: 634, icon: '📱' },
		{ name: 'Fashion', count: 523, icon: '👔' },
		{ name: 'Automotive', count: 287, icon: '🚗' },
		{ name: 'Art & Collectibles', count: 156, icon: '🎨' }
	];

	const filters = {
		priceRange: '$0 - $10,000+',
		location: 'All Regions',
		sustainability: 'All Certifications',
		status: 'All Statuses'
	};

	const searchQuery = '';
</script>

<PageLayout 
	title="Marketplace" 
	subtitle="Discover verified products with complete transparency and provenance tracking"
>
	<!-- Search and Filters -->
	<section class="mb-8">
		<div class="bg-gray-900 border border-gray-700 rounded-xl p-6">
			<div class="flex flex-col lg:flex-row gap-4 mb-6">
				<div class="flex-1">
					<input 
						type="text" 
						placeholder="Search products, manufacturers, or categories..."
						value={searchQuery}
						class="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
					>
				</div>
				<Button size="lg" class="px-8">
					Search
				</Button>
			</div>
			
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div>
					<label class="block text-gray-300 text-sm mb-2">Price Range</label>
					<select class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500">
						<option>All Prices</option>
						<option>$0 - $50</option>
						<option>$50 - $200</option>
						<option>$200 - $1,000</option>
						<option>$1,000+</option>
					</select>
				</div>
				<div>
					<label class="block text-gray-300 text-sm mb-2">Location</label>
					<select class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500">
						<option>All Regions</option>
						<option>North America</option>
						<option>Europe</option>
						<option>Asia</option>
						<option>South America</option>
					</select>
				</div>
				<div>
					<label class="block text-gray-300 text-sm mb-2">Certification</label>
					<select class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500">
						<option>All Certifications</option>
						<option>Organic</option>
						<option>Fair Trade</option>
						<option>Carbon Neutral</option>
						<option>Ethically Sourced</option>
					</select>
				</div>
				<div>
					<label class="block text-gray-300 text-sm mb-2">Availability</label>
					<select class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500">
						<option>All Statuses</option>
						<option>In Stock</option>
						<option>Pre-Order</option>
						<option>Limited</option>
					</select>
				</div>
			</div>
		</div>
	</section>

	<!-- Categories -->
	<section class="mb-8">
		<h2 class="text-xl font-semibold text-white mb-4">Browse Categories</h2>
		<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
			{#each categories as category}
				<Button href="/marketplace/category/{category.name.toLowerCase().replace(/\s+/g, '-')}" variant="outline" class="h-auto p-4 flex-col">
					<span class="text-2xl mb-2">{category.icon}</span>
					<span class="font-semibold">{category.name}</span>
					<span class="text-gray-400 text-sm">{category.count} products</span>
				</Button>
			{/each}
		</div>
	</section>

	<!-- Featured Products -->
	<section>
		<div class="flex items-center justify-between mb-6">
			<h2 class="text-xl font-semibold text-white">Featured Products</h2>
			<div class="flex gap-2">
				<Button variant="outline" size="sm">
					Most Popular
				</Button>
				<Button variant="ghost" size="sm">
					Newest
				</Button>
				<Button variant="ghost" size="sm">
					Price: Low to High
				</Button>
			</div>
		</div>

		<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
			{#each featuredProducts as product}
				<Card title={product.name} class="hover:border-green-500/30 transition-all duration-300">
					<div class="text-center">
						<!-- Product Image Placeholder -->
						<div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg h-48 flex items-center justify-center mb-4">
							<span class="text-6xl">{product.image}</span>
						</div>
						
						<!-- Product Info -->
						<div class="text-left">
							<div class="flex items-start justify-between mb-2">
								<h3 class="font-semibold text-white text-sm">{product.name}</h3>
								<span class="px-2 py-1 text-xs rounded-full {
									product.status === 'In Stock' ? 'bg-green-500/20 text-green-400' :
									product.status === 'Pre-Order' ? 'bg-blue-500/20 text-blue-400' :
									'bg-yellow-500/20 text-yellow-400'
								}">
									{product.status}
								</span>
							</div>
							
							<p class="text-gray-400 text-xs mb-2">by {product.manufacturer}</p>
							<p class="text-gray-400 text-xs mb-3">{product.description}</p>
							
							<div class="flex items-center justify-between text-xs mb-3">
								<span class="text-gray-400">📍 {product.location}</span>
								<div class="flex items-center">
									<span class="text-yellow-400">⭐</span>
									<span class="text-white ml-1">{product.rating}</span>
								</div>
							</div>
							
							<div class="mb-4">
								<p class="text-gray-400 text-xs mb-1">Certifications</p>
								<p class="text-green-400 text-xs">{product.sustainability}</p>
							</div>
							
							<div class="flex items-center justify-between">
								<span class="text-xl font-bold text-white">{product.price}</span>
								<div class="flex gap-2">
									<Button href="/product/{product.id}" variant="outline" size="sm">
										View
									</Button>
									<Button href="/marketplace/buy/{product.id}" size="sm">
										Buy
									</Button>
								</div>
							</div>
						</div>
					</div>
				</Card>
			{/each}
		</div>
		
		<!-- Load More -->
		<div class="text-center mt-8">
			<Button variant="outline" size="lg" class="px-8">
				Load More Products
			</Button>
		</div>
	</section>

	<!-- Trust & Security Info -->
	<section class="mt-12 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-6">
		<div class="text-center mb-6">
			<h3 class="text-xl font-semibold text-white mb-2">Why Choose ProviChain Marketplace?</h3>
			<p class="text-gray-300">Every product comes with complete transparency and verified provenance</p>
		</div>
		
		<div class="grid md:grid-cols-3 gap-6">
			<div class="text-center">
				<div class="text-4xl mb-3">🛡️</div>
				<h4 class="font-semibold text-white mb-2">Verified Authenticity</h4>
				<p class="text-gray-300 text-sm">Every product is verified through blockchain and real-world validation</p>
			</div>
			<div class="text-center">
				<div class="text-4xl mb-3">🌱</div>
				<h4 class="font-semibold text-white mb-2">Sustainability Tracking</h4>
				<p class="text-gray-300 text-sm">Complete environmental impact and sustainability certification</p>
			</div>
			<div class="text-center">
				<div class="text-4xl mb-3">📍</div>
				<h4 class="font-semibold text-white mb-2">Full Provenance</h4>
				<p class="text-gray-300 text-sm">Track your product's journey from origin to your doorstep</p>
			</div>
		</div>
	</section>
</PageLayout>
