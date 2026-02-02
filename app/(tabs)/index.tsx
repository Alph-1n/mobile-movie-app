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
        
      </View>
    </SafeAreaView>
  );
}