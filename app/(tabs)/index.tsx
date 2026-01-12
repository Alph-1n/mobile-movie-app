import { images } from "@/constants/images";
import { icons } from "@/constants/icons";
import { Text, Image, ScrollView, View, StyleSheet, ActivityIndicator, FlatList } from "react-native";
import SearchBar from "@/components/SearchBar";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import useFetch from "@/Services/useFetch";
import { fetchMovies } from "@/Services/api";

export default function Index() {
  const router = useRouter();
  
  // Fetch latest movies (no query = popular movies)
  const { 
    data: movies, 
    loading: moviesLoading, 
    error: moviesError 
  } = useFetch(() => fetchMovies({ query: '' }));

  return (
    <SafeAreaView className="flex-1 bg-primary" edges={['top']}>
      <View className="flex-1">
        {/* Background image covers entire screen */}
        <Image 
          source={images.bg} 
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ 
            paddingHorizontal: 20,
            paddingTop: 40,
            paddingBottom: 100,
            alignItems: 'center'
          }}
        >
          {/* Logo at top center */}
          <Image 
            source={icons.logo} 
            style={{ width: 48, height: 40, marginBottom: 20 }}
            resizeMode="contain"
          />
          
          {/* Search Bar - ALWAYS visible at top */}
          <View className="w-full mb-5">
            <SearchBar
              onPress={() => {
                router.push('/search');
              }}
              placeholder="Search for a movie"
            />
          </View>

          {/* Latest Movies Section */}
          <View className="w-full">
            <Text className="text-lg text-white font-bold mb-3">Latest Movies</Text>
            
            {/* Loading State */}
            {moviesLoading ? (
              <ActivityIndicator
                size="large"
                color='#A8B5DB'
                className='mt-10 self-center'
              />
            ) : moviesError ? (
              /* Error State - Show detailed error message */
              <View className="mt-5 p-4 bg-red-500/20 rounded-lg">
                <Text className="text-red-500 font-bold text-center mb-2">
                  Error Fetching Movies
                </Text>
                <Text className="text-red-400 text-sm text-center">
                  {moviesError?.message || 'Failed to fetch data from server'}
                </Text>
                <Text className="text-red-400 text-xs text-center mt-2">
                  Please check your API key and internet connection
                </Text>
              </View>
            ) : movies && movies.length > 0 ? (
              /* Success State - Show movies */
              <FlatList
                data={movies}
                renderItem={({ item }) => (
                  <View className="bg-white/10 rounded-lg p-2 mb-2">
                    <Text className="text-white text-sm font-semibold" numberOfLines={2}>
                      {item.title}
                    </Text>
                  </View>
                )}
                keyExtractor={(item) => item.id.toString()}
                numColumns={3}
                columnWrapperStyle={{ 
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 10
                }}
                scrollEnabled={false}
              />
            ) : (
              /* Empty State - No movies found */
              <View className="mt-5 p-4 bg-yellow-500/20 rounded-lg">
                <Text className="text-yellow-500 text-center">
                  No movies found
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}