import { useNavigate } from "react-router-dom";
import { Button } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';

export default function BackButton({ variant = "subtle", to = -1 }) {
    const navigate = useNavigate();

    return(
        <Button 
            variant={variant} 
            leftSection={<IconArrowLeft size={16} />} 
            onClick={() => navigate(to)}
            mb="md"
            ml="xs"
        >
            戻る
        </Button>
    );
}