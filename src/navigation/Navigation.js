import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Splash from '../screen/Onboarding/Splash';
import Login from '../screen/Onboarding/Login';
import Register from '../screen/Onboarding/Register';
import BottomTabNavigator from './BottomTabNavigator';
import SearchByCategoryScreen from '../screen/SearchByCategory/SearchByCategoryScreen';
import ProductList from '../screen/Product/ProductList';
import ProductDetail from '../screen/Product/ProductDetails';
import SearchByVehicleScreen from '../screen/SearchByVehicle/SearchByVehicleScreen';
import SearchByProductNameScreen from '../screen/SearchByProduct/SearchByProductNameScreen';
import SearchByPartScreen from '../screen/SearchByPart/SearchByPartScreen';
import ContactUs from '../screen/ContactUs/ContactUs';
import BulkOrder from '../screen/BulkOrder/BulkOrderScreen';
import Checkout from '../screen/Cart/Checkout';
import OrderHistory from '../screen/OrderHistory/OrderHistory';
import RewardClaimsScreen from '../screen/Profile/RewardClaimsScreen';

const Stack = createNativeStackNavigator();

const Navigation = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen
                    name="Splash"
                    component={Splash}
                    options={{
                        headerShown: false,
                    }}
                />

                <Stack.Screen
                    name="Login"
                    component={Login}
                    options={{
                        headerShown: false,
                    }}
                />

                <Stack.Screen
                    name="Register"
                    component={Register}
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="ProductList"
                    component={ProductList}
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="ProductDetail"
                    component={ProductDetail}
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="SearchByCategoryScreen"
                    component={SearchByCategoryScreen}
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="SearchByVehicleScreen"
                    component={SearchByVehicleScreen}
                    options={{
                        headerShown: false,
                    }}
                />

                <Stack.Screen
                    name="SearchByProductNameScreen"
                    component={SearchByProductNameScreen}
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="SearchByPartScreen"
                    component={SearchByPartScreen}
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="ContactUs"
                    component={ContactUs}
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="BulkOrderScreen"
                    component={BulkOrder}
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="Checkout"
                    component={Checkout}
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="OrderHistory"
                    component={OrderHistory}
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="RewardClaimsScreen"
                    component={RewardClaimsScreen}
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="MainTabs"
                    component={BottomTabNavigator}
                    options={{ headerShown: false }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default Navigation;
