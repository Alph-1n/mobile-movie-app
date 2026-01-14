import { images } from "@/constants/images";
import { icons } from "@/constants/icons";
import { Text, Image, ScrollView, View, StyleSheet, ActivityIndicator, FlatList } from "react-native";
import SearchBar from "@/components/SearchBar";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import useFetch from "@/Services/useFetch";
import { fetchMovies } from "@/Services/api";
import MovieCard from "@/components/MovieCard";

export default function Index() {
  const router = useRouter();
  
  const { 
    data: movies, 
    loading: moviesLoading, 
    error: moviesError 
  } = useFetch(() => fetchMovies({ query: '' })); //tyoe inside '' to get the movies like iron man

  return (
    <SafeAreaView className="flex-1 bg-primary" edges={['top']}>
      <View className="flex-1">
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
          <Image 
            source={icons.logo} 
            style={{ width: 48, height: 40, marginBottom: 20 }}
            resizeMode="contain"
          />
          
          <View className="w-full mb-5">
            <SearchBar
              onPress={() => {
                router.push('/search');
              }}
              placeholder="Search for a movie"
            />
          </View>

          <View className="w-full">
            <Text className="text-lg text-white font-bold mb-3">Latest Movies</Text>
            
            {moviesLoading ? (
              <ActivityIndicator
                size="large"
                color='#A8B5DB'
                className='mt-10 self-center'
              />
            ) : moviesError ? (
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
              <FlatList
                data={movies}
                renderItem={({ item }) => (
                  <MovieCard {...item} />
                )}
                keyExtractor={(item) => item.id.toString()}
                numColumns={3}
                columnWrapperStyle={{ 
                  justifyContent: 'space-between',
                  marginBottom: 10
                }}
                scrollEnabled={false}
              />
            ) : (
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