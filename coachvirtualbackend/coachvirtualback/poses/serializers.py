from rest_framework import serializers
from .models import PoseTrainingData

class PoseTrainingDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = PoseTrainingData
        fields = [
            'id', 'ejercicio', 'tipo', 
            'landmarks', 'angulos',  # Para snapshots
            'frames', 'duracion_segundos', 'fps', 'total_frames',  # Para secuencias
            'etiqueta', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def validate_etiqueta(self, value):
        if value not in ['correcto', 'incorrecto']:
            raise serializers.ValidationError("La etiqueta debe ser 'correcto' o 'incorrecto'")
        return value
    
    def validate_tipo(self, value):
        if value not in ['snapshot', 'secuencia']:
            raise serializers.ValidationError("El tipo debe ser 'snapshot' o 'secuencia'")
        return value
    
    def validate(self, data):
        """
        Validación cruzada: 
        - Si es snapshot, debe tener landmarks y angulos
        - Si es secuencia, debe tener frames
        """
        tipo = data.get('tipo', 'snapshot')
        
        if tipo == 'snapshot':
            if not data.get('landmarks') or not data.get('angulos'):
                raise serializers.ValidationError(
                    "Los snapshots deben incluir 'landmarks' y 'angulos'"
                )
        elif tipo == 'secuencia':
            if not data.get('frames'):
                raise serializers.ValidationError(
                    "Las secuencias deben incluir 'frames'"
                )
            if data.get('total_frames') and len(data['frames']) != data['total_frames']:
                raise serializers.ValidationError(
                    "El número de frames no coincide con total_frames"
                )
        
        return data
