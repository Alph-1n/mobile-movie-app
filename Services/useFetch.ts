
import { use,useEffect, useState } from "react";

const useFetch = <T>(fetchFunction:()=>Promise<T>, autoFetch = true)=>{
                 const [data, setData] = useState<T | null>(null);
                 const [loading,setLoading] = useState(false);
                 const [error, setError] = useState<string | null>(null);

                 const fetchData = async () => {
                   
                   try {
                    setLoading(true);
                    setError(null);

                     const result = await fetchFunction();
                     setData(result);
                   } catch (err) {
                    //@ts-ignore
                     setError(err instanceof Error ? err : new Error('an error occured while fetching data'));
                   } finally {
                     setLoading(false); //finally gets executed when try succeeds or catch is finished
                   }
                 };

                 const reset =()=>{
                    setData(null);
                    setLoading(false);
                    setError(null);
                 }
                useEffect(() => {
                  if (autoFetch) {
                    fetchData();
                  }
                }, []);
                 return { data, loading, error, refetch:fetchData, reset };
}

export default useFetch