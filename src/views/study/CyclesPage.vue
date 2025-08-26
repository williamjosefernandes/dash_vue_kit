<script setup lang="ts">
import { ref } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import SvgSprite from '@/components/shared/SvgSprite.vue';

const page = ref({ title: 'Ciclos de Estudos' });
const breadcrumbs = ref([
  { title: 'Estudos', disabled: false, href: '#' },
  { title: 'Ciclos de Estudos', disabled: true, href: '#' }
]);
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  
  <UiParentCard title="Ciclos de Estudos">
    <template v-slot:action>
      <v-btn color="primary" prepend-icon="mdi-plus">
        Novo Ciclo
      </v-btn>
    </template>

    <div class="text-center py-12">
      <SvgSprite name="custom-refresh" style="width: 64px; height: 64px; opacity: 0.3" />
      <h5 class="text-h5 mt-4 mb-2">Nenhum ciclo de estudos criado</h5>
      <p class="text-subtitle-1 text-lightText mb-4">
        Organize seus estudos em ciclos estruturados para melhor aproveitamento
      </p>
      <v-btn color="primary" prepend-icon="mdi-plus">
        Criar Primeiro Ciclo
      </v-btn>
    </div>
  </UiParentCard>
</template>